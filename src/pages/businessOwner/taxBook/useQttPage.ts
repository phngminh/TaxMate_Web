import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBusiness } from '../../../contexts/BusinessContext'
import * as api from '../../../apis/taxBook.api'
import { getPaymentAccounts } from '../../../apis/paymentAccount.api'
import { submitTaxDeclaration } from '../../../apis/taxDeclaration.api'
import { applyTknQttNextStep, getTknQttNextStep } from '../../../apis/tknTaxPeriod.api'
import type { PaymentAccount } from '../../../types/paymentAccount.type'
import type { QttCalculationPreview, QttDeclaration, QttOffsetObligationOption, QttPreview } from '../../../types/taxBook.type'
import type { TknQttNextStep } from '../../../types/tknTaxPeriod.type'
import { allocationError, allocationFromDeclaration, allocationRequest, emptyAllocation } from './qttAllocation'
import { confirmAndDownloadQtt, isQttLocked, QttReviewRequired, type QttStep } from './qttWorkflow'

export function useQttPage() {
  const { currentBusiness } = useBusiness()
  const [params, setParams] = useSearchParams()
  const requestedYear = Number(params.get('year'))
  const year = Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100
    ? requestedYear : new Date().getFullYear()
  const fromTkn = params.get('fromTkn')
  const businessId = currentBusiness?.id
  const contextKey = `${businessId}:${year}:${fromTkn ?? ''}`
  const context = useRef(contextKey)
  const lock = useRef(false)
  const requestId = useRef(0)
  const [loadedKey, setLoadedKey] = useState('')
  const [preview, setPreview] = useState<QttPreview | null>(null)
  const [calculation, setCalculation] = useState<QttCalculationPreview | null>(null)
  const [declaration, setDeclaration] = useState<QttDeclaration | null>(null)
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [obligations, setObligations] = useState<QttOffsetObligationOption[]>([])
  const [bridge, setBridge] = useState<TknQttNextStep | null>(null)
  const [allocation, setAllocation] = useState(emptyAllocation)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<QttStep>('idle')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [needsReconcile, setNeedsReconcile] = useState(false)
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false)

  useEffect(() => {
    context.current = contextKey
    return () => { context.current = '' }
  }, [contextKey])

  const load = useCallback(async () => {
    if (!businessId) { setLoading(false); return }
    const id = ++requestId.current
    const active = () => id === requestId.current && context.current === contextKey
    setLoading(true)
    setError(null)
    try {
      // Locked snapshots must remain available even if live readiness is unavailable.
      const saved = await api.getQttDeclaration(businessId, year)
      if (!active()) return
      setDeclaration(saved)
      setAllocation(saved ? allocationFromDeclaration(saved) : emptyAllocation())
      if (isQttLocked(saved)) {
        setPreview(null)
        setCalculation(null)
        setBridge(null)
        setAccounts([])
        setObligations([])
      } else {
        const p = await api.getQttPreview(businessId, year)
        if (!active()) return
        setPreview(p)
        const c = p.canClose && !saved ? await api.getQttCalculationPreview(businessId, year) : null
        if (!active()) return
        setCalculation(c)
        const hasOverpayment = (saved?.indicators ?? c?.indicators)?.indicator20 ?? 0
        if (hasOverpayment > 0) {
          const [a, o, b] = await Promise.all([
            getPaymentAccounts(businessId), api.getQttOffsetObligations(businessId),
            fromTkn ? getTknQttNextStep(fromTkn) : Promise.resolve(null)
          ])
          if (!active()) return
          setAccounts((a.data ?? []).filter(x => x.accountType === 'Bank' && x.isActive))
          setObligations(o)
          setBridge(b)
        } else { setAccounts([]); setObligations([]); setBridge(null) }
      }
      setNeedsReconcile(false)
      setLoadedKey(contextKey)
    } catch {
      if (active()) {
        setNeedsReconcile(true)
        setError('Chưa tải được đầy đủ dữ liệu. Hãy kiểm tra kết nối và tải lại.')
      }
    } finally { if (active()) setLoading(false) }
  }, [businessId, year, fromTkn, contextKey])

  useEffect(() => {
    let disposed = false
    queueMicrotask(() => {
      if (disposed) return
      setPreview(null); setDeclaration(null); setCalculation(null)
      setAllocation(emptyAllocation()); setNotice(null); setShowSubmitConfirmation(false)
      void load()
    })
    return () => { disposed = true }
  }, [load])

  const indicators = declaration?.indicators ?? calculation?.indicators
  const screen = isQttLocked(declaration) ? 'locked' : preview ? preview.canClose ? 'draft' : 'blocked' : null
  const bridgeError = fromTkn && screen === 'draft' && indicators && indicators.indicator20 > 0 &&
    (!bridge || bridge.taxYear !== year || !bridge.canCreateQttDraft || !bridge.choices.includes('Offset'))
    ? 'Chưa thể bù trừ từ thông báo doanh thu này. Hãy kiểm tra lại thông báo doanh thu.' : null
  const validation = indicators ? allocationError(allocation, indicators, Boolean(fromTkn)) : null

  const downloadFile = async (d: QttDeclaration, active: () => boolean) => {
    const blob = await api.exportQttDeclaration(businessId!, d.declarationId)
    if (!active()) return
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `02-CNKD-TNCN-QTT_${d.taxCode}_${year}.docx`
    document.body.appendChild(anchor); anchor.click(); anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Đã gửi tệp tờ khai đến trình duyệt. Tải tệp không đồng nghĩa đã nộp hồ sơ hoặc tiền thuế.')
  }

  const confirmAndDownload = async () => {
    if (!businessId || !indicators || lock.current || needsReconcile || loading || bridgeError) return
    lock.current = true
    const key = contextKey
    const active = () => context.current === key
    const assertActive = () => { if (!active()) throw new Error('Context changed') }
    const selected = structuredClone(allocation)
    const operation: { stage: QttStep } = { stage: 'check' }
    setError(null); setNotice(null)
    try {
      await confirmAndDownloadQtt({
        shown: indicators, previous: declaration,
        onStep: next => { assertActive(); operation.stage = next; setStep(next) },
        getDeclaration: async () => {
          const d = await api.getQttDeclaration(businessId, year); assertActive(); return d
        },
        checkReady: async () => {
          const p = await api.getQttPreview(businessId, year); assertActive(); setPreview(p); return p.canClose
        },
        calculate: async () => (await api.calculateQtt(businessId, year)).calculation,
        create: () => api.createQttDeclaration(businessId, year),
        onCalculation: c => { assertActive(); setCalculation(c) },
        onDeclaration: d => { assertActive(); setDeclaration(d) },
        validate: i => {
          assertActive()
          const message = allocationError(selected, i, Boolean(fromTkn))
          if (message) throw new QttReviewRequired(message)
        },
        saveAllocation: async d => {
          const request = allocationRequest(selected, d.indicators.indicator20, d.draftRevision)
          if (!fromTkn) return api.updateQttAllocation(businessId, d.declarationId, request)
          const fresh = await getTknQttNextStep(fromTkn)
          assertActive()
          if (fresh.taxYear !== year || !fresh.canCreateQttDraft || !fresh.choices.includes('Offset') ||
            fresh.incomeBasedPitPaid !== request.offsetAmount || fresh.qttDraftRevision !== d.draftRevision) {
            throw new QttReviewRequired('Thông báo doanh thu đã thay đổi. Hãy tải lại và kiểm tra số tiền bù trừ.')
          }
          await applyTknQttNextStep(fromTkn, { choice: 'Offset', refundPaymentAccountId: null, offsetItems: request.offsetItems })
          assertActive()
          const saved = await api.getQttDeclaration(businessId, year)
          if (!saved) throw new Error('Missing declaration')
          return saved
        },
        confirm: d => api.confirmQttDeclaration(businessId, d.declarationId, d.draftRevision),
        download: d => downloadFile(d, active)
      })
    } catch (e) {
      if (!active()) return
      if (operation.stage === 'download') {
        setError('Hồ sơ đã khóa. Chưa tải được tờ khai; hãy bấm “Tải lại tờ khai”.')
      } else {
        setStep('reconcile'); setNeedsReconcile(true)
        try {
          const saved = await api.getQttDeclaration(businessId, year)
          if (!active()) return
          setDeclaration(saved)
          if (saved) setAllocation(allocationFromDeclaration(saved))
          setNeedsReconcile(false)
          setError(isQttLocked(saved) ? 'Hồ sơ đã khóa. Bạn có thể tải lại tờ khai.'
            : e instanceof QttReviewRequired ? e.message
              : 'Chưa hoàn tất hồ sơ. Đã kiểm tra trạng thái đã lưu; hãy kiểm tra lại trước khi thử tiếp.')
        } catch {
          if (active()) setError('Chưa xác định được trạng thái đã lưu. Hãy kiểm tra lại trạng thái trước khi tiếp tục.')
        }
      }
    } finally {
      lock.current = false
      setStep('idle')
    }
  }

  const downloadOnly = async () => {
    if (!businessId || !isQttLocked(declaration) || lock.current) return
    lock.current = true; setStep('download'); setError(null)
    const active = () => context.current === contextKey
    try { await downloadFile(declaration, active) }
    catch { if (active()) setError('Chưa tải được tờ khai. Hồ sơ vẫn được giữ nguyên; hãy thử tải lại.') }
    finally { lock.current = false; setStep('idle') }
  }

  const reviewPeriod = async (targetBusinessId: string, quarter: number) => {
    if (lock.current) return
    lock.current = true; setStep('review'); setError(null)
    const active = () => context.current === contextKey
    try {
      await api.confirmS2cEvidenceReview(targetBusinessId, year, quarter)
      if (active()) await load()
    } catch { if (active()) setError('Chưa xác nhận được việc kiểm tra chi phí. Hãy tải lại để kiểm tra trạng thái.') }
    finally { lock.current = false; setStep('idle') }
  }

  const markSubmitted = async () => {
    if (!declaration || declaration.status !== 'Generated' || lock.current) return
    lock.current = true; setStep('submit'); setError(null)
    const active = () => context.current === contextKey
    try {
      await submitTaxDeclaration(declaration.declarationId)
      if (active()) { setDeclaration({ ...declaration, status: 'Submitted' }); setShowSubmitConfirmation(false) }
    } catch {
      if (active()) { await load(); setError('Chưa nhận được xác nhận. Hãy kiểm tra trạng thái hồ sơ trước khi thử lại.') }
    } finally { lock.current = false; setStep('idle') }
  }

  return {
    year, setYear: (next: number) => setParams({ year: String(next) }), fromTkn,
    preview, calculation, declaration, indicators, screen, accounts, setAccounts, obligations,
    allocation, setAllocation, error, notice, loading: loading || (loadedKey !== contextKey && !error),
    busy: step !== 'idle', step, needsReconcile, validation: bridgeError ?? validation,
    showSubmitConfirmation, setShowSubmitConfirmation,
    load, confirmAndDownload, downloadOnly, reviewPeriod, markSubmitted
  }
}
