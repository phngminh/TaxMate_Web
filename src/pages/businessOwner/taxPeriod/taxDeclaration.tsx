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
import { getPaymentAccounts } from '../../../apis/paymentAccount.api'

import {
  getTaxPeriodById
} from '../../../apis/taxPeriod.api'
import {
  applyTknQttNextStep,
  getTknQttNextStep
} from '../../../apis/tknTaxPeriod.api'

import path from '../../../constants/path'

import type {
  TaxDeclaration
} from '../../../types/taxDeclaration.type'

import type {
  TaxPeriodDetail
} from '../../../types/taxPeriod.type'
import type { PaymentAccount } from '../../../types/paymentAccount.type'
import type { TknQttNextStep } from '../../../types/tknTaxPeriod.type'

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

  const [qttNextStep, setQttNextStep] =
    useState<TknQttNextStep | null>(null)
  const [refundAccounts, setRefundAccounts] =
    useState<PaymentAccount[]>([])
  const [refundAccountId, setRefundAccountId] =
    useState('')
  const [isApplyingNextStep, setIsApplyingNextStep] =
    useState(false)
  const [nextStepError, setNextStepError] =
    useState<string | null>(null)

  async function loadTknNextStep(
    period: TaxPeriodDetail
  ) {
    if (
      period.periodType !== 'Tkn' ||
      period.filingWindow === 'FirstHalf' ||
      !['Submitted', 'Paid'].includes(
        period.status
      )
    ) {
      setQttNextStep(null)
      return
    }

    try {
      setNextStepError(null)
      const [nextStep, accountResponse] =
        await Promise.all([
          getTknQttNextStep(period.id),
          getPaymentAccounts(
            period.businessId
          )
        ])
      const accounts =
        (accountResponse.data ?? []).filter(
          (account) =>
            account.accountType === 'Bank' &&
            account.isActive
        )
      setQttNextStep(nextStep)
      setRefundAccounts(accounts)
      setRefundAccountId(
        accounts.find(
          (account) => account.isDefault
        )?.paymentAccountId ??
          accounts[0]?.paymentAccountId ??
          ''
      )
    } catch (error) {
      console.error(
        '[TaxDeclaration] TKN next step failed:',
        error
      )
      setNextStepError(
        'Không thể tải bước xử lý thuế TNCN đã tạm nộp.'
      )
    }
  }

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
        await loadTknNextStep(
          periodResult
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
      if (
        taxPeriod?.periodType === 'Tkn'
      ) {
        const submittedPeriod = {
          ...taxPeriod,
          status: 'Submitted' as const
        }
        setTaxPeriod(submittedPeriod)
        await loadTknNextStep(
          submittedPeriod
        )
      }
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

  async function applyNextStep(
    choice: 'Later' | 'Refund'
  ) {
    if (!taxPeriodId) return
    if (
      choice === 'Refund' &&
      !refundAccountId
    ) {
      toast.warning(
        'Hãy chọn tài khoản ngân hàng nhận hoàn.'
      )
      return
    }

    try {
      setIsApplyingNextStep(true)
      const result =
        await applyTknQttNextStep(
          taxPeriodId,
          {
            choice,
            refundPaymentAccountId:
              choice === 'Refund'
                ? refundAccountId
                : null,
            offsetItems: []
          }
        )
      setQttNextStep(result)
      toast.success(
        choice === 'Later'
          ? 'Chưa tạo QTT. Bạn có thể quay lại xử lý khoản này sau.'
          : 'Đã tạo hồ sơ QTT nháp để đề nghị hoàn.'
      )
    } catch (error) {
      console.error(
        '[TaxDeclaration] Apply TKN next step failed:',
        error
      )
      toast.error(
        'Không thể lưu lựa chọn xử lý khoản TNCN đã tạm nộp.'
      )
    } finally {
      setIsApplyingNextStep(false)
    }
  }

  const isTkn =
    taxPeriod.periodType === 'Tkn'
  const isTknYearEnd =
    isTkn &&
    taxPeriod.filingWindow !== 'FirstHalf'

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
                  {isTkn
                    ? 'Thông báo doanh thu'
                    : 'Tờ khai thuế'}
                </h1>

                <p className='mt-1 text-sm text-gray-500'>
                  {isTkn
                    ? 'Kiểm tra mẫu 01/TKN-CNKD trước khi tải hoặc gửi hồ sơ.'
                    : 'Kiểm tra thông tin trước khi xuất hồ sơ.'}
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
              {isTkn
                ? 'Chưa có thông báo doanh thu'
                : 'Chưa có tờ khai'}
            </h2>

            <p className='mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500'>
              {isTkn
                ? 'Doanh thu kỳ này đã được tổng hợp. Bạn có thể tạo mẫu 01/TKN-CNKD từ dữ liệu đã chốt.'
                : 'Kỳ thuế đã được tính. Bạn có thể tạo tờ khai 01/CNKD từ dữ liệu hiện tại.'}
            </p>

            <button
              type='button'
              disabled={isCreating}
              onClick={handleCreate}
              className='mt-6 h-12 rounded-xl bg-red-600 px-7 text-sm font-bold text-white hover:bg-red-700 disabled:bg-gray-300'
            >
              {isCreating
                ? 'Đang tạo...'
                : isTkn
                  ? 'Tạo mẫu 01/TKN-CNKD'
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
                  : isTkn
                    ? 'Tải mẫu 01/TKN-CNKD'
                    : 'Xuất tờ khai DOCX'}
              </button>

              {declaration.status ===
              'Submitted' ? (
                <div className='flex h-12 items-center gap-2 rounded-xl bg-green-100 px-7 text-sm font-bold text-green-700'>
                  <CheckCircle2 size={18} />

                  {isTkn
                    ? 'TKN đã được gửi'
                    : 'Tờ khai đã được gửi'}
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
                    : isTkn
                      ? 'Đánh dấu đã gửi TKN'
                      : 'Gửi tờ khai'}
                </button>
              )}
            </div>

            {isTknYearEnd &&
              ['Submitted', 'Paid'].includes(
                taxPeriod.status
              ) && (
              <section className='mt-6 rounded-2xl border border-violet-200 bg-violet-50 p-6'>
                <h2 className='text-lg font-black text-violet-900'>
                  Bước tiếp theo sau TKN
                </h2>

                {nextStepError ? (
                  <p className='mt-3 text-sm font-semibold text-red-600'>
                    {nextStepError}
                  </p>
                ) : !qttNextStep ? (
                  <p className='mt-3 text-sm text-violet-700'>
                    Đang kiểm tra khoản thuế TNCN đã tạm nộp...
                  </p>
                ) : qttNextStep.qttDeclarationStatus &&
                  qttNextStep.qttDeclarationStatus !== 'Draft' ? (
                  <div className='mt-3 rounded-xl border border-violet-200 bg-white p-4'>
                    <p className='text-sm font-bold text-violet-900'>
                      Hồ sơ QTT đã được chốt
                    </p>
                    <p className='mt-1 text-sm leading-6 text-gray-600'>
                      Hồ sơ QTT hiện tại không còn ở trạng thái nháp nên không thể thay đổi lựa chọn hoàn hoặc bù trừ từ TKN.
                    </p>
                    <button
                      type='button'
                      onClick={() =>
                        navigate(
                          `${path.BUSINESS_OWNER_QTT}?year=${qttNextStep.taxYear}`
                        )
                      }
                      className='mt-4 h-10 rounded-lg bg-violet-600 px-5 text-sm font-bold text-white hover:bg-violet-700'
                    >
                      Xem hồ sơ QTT
                    </button>
                  </div>
                ) : qttNextStep.choices.length === 0 ? (
                  <div className='mt-3 flex gap-3 rounded-xl bg-white p-4 text-green-700'>
                    <CheckCircle2
                      size={20}
                      className='shrink-0'
                    />
                    <div>
                      <p className='text-sm font-bold'>
                        Hồ sơ TKN đã hoàn tất
                      </p>
                      <p className='mt-1 text-sm leading-6 text-gray-600'>
                        Không có khoản PIT theo phương pháp thu nhập cần tạo thêm hồ sơ QTT.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className='mt-2 text-sm leading-6 text-violet-800'>
                      Bạn đã tạm nộp{' '}
                      <strong>
                        {formatMoney(
                          qttNextStep.incomeBasedPitPaid
                        )}
                      </strong>{' '}
                      thuế TNCN theo phương pháp thu nhập. Khoản này có thể được xử lý là thuế nộp thừa; cơ quan thuế sẽ tiếp nhận và quyết định số được hoàn hoặc bù trừ.
                    </p>

                    {qttNextStep.blockingIssues.length > 0 && (
                      <div className='mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4'>
                        <p className='text-sm font-bold text-amber-800'>
                          Cần rà soát trước khi tạo QTT
                        </p>
                        <ul className='mt-2 space-y-1 text-sm text-amber-700'>
                          {qttNextStep.blockingIssues.map(
                            (issue) => (
                              <li key={`${issue.code}-${issue.sourceId ?? ''}`}>
                                {issue.message}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    <div className='mt-5 grid gap-4 lg:grid-cols-3'>
                      <div className='rounded-xl border border-violet-200 bg-white p-4'>
                        <h3 className='font-black text-gray-900'>
                          Để lại xử lý sau
                        </h3>
                        <p className='mt-1 text-sm leading-6 text-gray-500'>
                          Hoàn tất TKN và chưa tạo hồ sơ QTT lúc này.
                        </p>
                        <button
                          type='button'
                          disabled={
                            isApplyingNextStep ||
                            !qttNextStep.choices.includes('Later')
                          }
                          onClick={() =>
                            void applyNextStep('Later')
                          }
                          className='mt-4 h-10 w-full rounded-lg border border-violet-300 text-sm font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-50'
                        >
                          Để xử lý sau
                        </button>
                      </div>

                      <div className='rounded-xl border border-violet-200 bg-white p-4'>
                        <h3 className='font-black text-gray-900'>
                          Đề nghị hoàn thuế
                        </h3>
                        <label className='mt-3 block text-sm font-semibold text-gray-600'>
                          Tài khoản ngân hàng nhận hoàn
                          <select
                            value={refundAccountId}
                            onChange={(event) =>
                              setRefundAccountId(
                                event.target.value
                              )
                            }
                            className='mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm'
                          >
                            <option value=''>Chọn tài khoản</option>
                            {refundAccounts.map(
                              (account) => (
                                <option
                                  key={account.paymentAccountId}
                                  value={account.paymentAccountId}
                                >
                                  {account.bankShortName || account.bankName} · {account.accountNumber}
                                </option>
                              )
                            )}
                          </select>
                        </label>
                        {refundAccounts.length === 0 && (
                          <button
                            type='button'
                            onClick={() =>
                              navigate(
                                path.BUSINESS_OWNER_BANK_CONFIG
                              )
                            }
                            className='mt-2 text-sm font-bold text-red-600 hover:underline'
                          >
                            Thêm tài khoản nhận tiền
                          </button>
                        )}
                        <button
                          type='button'
                          disabled={
                            isApplyingNextStep ||
                            !qttNextStep.choices.includes('Refund') ||
                            !qttNextStep.canCreateQttDraft ||
                            !refundAccountId
                          }
                          onClick={() =>
                            void applyNextStep('Refund')
                          }
                          className='mt-4 h-10 w-full rounded-lg bg-violet-600 text-sm font-bold text-white hover:bg-violet-700 disabled:bg-gray-300'
                        >
                          Tạo QTT đề nghị hoàn
                        </button>
                      </div>

                      <div className='rounded-xl border border-violet-200 bg-white p-4'>
                        <h3 className='font-black text-gray-900'>
                          Bù trừ nghĩa vụ thuế
                        </h3>
                        <p className='mt-1 text-sm leading-6 text-gray-500'>
                          Mở màn QTT để chọn nghĩa vụ và phân bổ đủ số tiền bù trừ.
                        </p>
                        <button
                          type='button'
                          disabled={
                            !qttNextStep.choices.includes('Offset') ||
                            !qttNextStep.canCreateQttDraft
                          }
                          onClick={() =>
                            navigate(
                              `${path.BUSINESS_OWNER_QTT}?year=${qttNextStep.taxYear}&fromTkn=${taxPeriod.id}`
                            )
                          }
                          className='mt-4 h-10 w-full rounded-lg bg-violet-600 text-sm font-bold text-white hover:bg-violet-700 disabled:bg-gray-300'
                        >
                          Mở QTT để bù trừ
                        </button>
                      </div>
                    </div>

                    {qttNextStep.selectedChoice && (
                      <p className='mt-4 text-sm font-bold text-green-700'>
                        Lựa chọn đã lưu:{' '}
                        {qttNextStep.selectedChoice === 'Later'
                          ? 'Xử lý sau'
                          : qttNextStep.selectedChoice === 'Refund'
                            ? 'Đề nghị hoàn'
                            : 'Bù trừ'}.
                      </p>
                    )}
                  </>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <ConfirmDialog
        open={isSubmitConfirmOpen}
        title={isTkn
          ? 'Xác nhận đã gửi thông báo doanh thu'
          : 'Xác nhận gửi tờ khai'}
        description={isTkn
          ? 'Sau khi xác nhận, hồ sơ 01/TKN-CNKD sẽ chuyển sang trạng thái Đã gửi. Vui lòng kiểm tra kỹ bản tải về trước khi tiếp tục.'
          : 'Sau khi gửi, tờ khai sẽ chuyển sang trạng thái Đã gửi. Vui lòng kiểm tra kỹ thông tin trước khi tiếp tục.'}
        confirmLabel={isTkn
          ? 'Xác nhận đã gửi'
          : 'Gửi tờ khai'}
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
