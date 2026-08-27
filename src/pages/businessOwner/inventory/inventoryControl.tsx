import { useEffect, useState } from 'react'
import { ClipboardCheck, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { getInventoryInitializationPreview, initializeInventory, reconcileInventory } from '../../../apis/inventory.api'
import { toggleStockTracking } from '../../../apis/profile.api'
import { useBusiness } from '../../../contexts/BusinessContext'
import type { InventoryInitializationPreview, ReconcileInventoryRequest } from '../../../types/inventory.type'

interface CountInput {
  quantity: number
  unitValue: number
}

export default function InventoryControlPage() {
  const { businesses, currentBusiness, setBusinesses, setCurrentBusiness } = useBusiness()
  const [preview, setPreview] = useState<InventoryInitializationPreview | null>(null)
  const [counts, setCounts] = useState<Record<string, CountInput>>({})
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10))
  const [documentNumber, setDocumentNumber] = useState(`KK-${Date.now().toString().slice(-6)}`)
  const [description, setDescription] = useState('Kiểm kê tồn kho thực tế')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const keyOf = (productId: string | null, ingredientId: string | null) => productId ?? ingredientId ?? ''

  const load = async () => {
    if (!currentBusiness) return
    try {
      setLoading(true)
      const result = await getInventoryInitializationPreview(currentBusiness.id)
      setPreview(result)
      setDescription(result.isInitialized ? 'Kiểm kê tồn kho thực tế' : 'Xác nhận tồn kho ban đầu')
      setCounts(Object.fromEntries(result.items.map(item => [
        keyOf(item.productId, item.ingredientId),
        { quantity: item.currentQuantity, unitValue: item.currentUnitValue ?? 0 }
      ])))
    } catch {
      toast.error('Không thể tải dữ liệu tồn kho')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [currentBusiness?.id])

  const updateBusinessTracking = (enabled: boolean) => {
    if (!currentBusiness) return
    const updated = { ...currentBusiness, isStockTrackingEnabled: enabled }
    setCurrentBusiness(updated)
    setBusinesses(businesses.map(item => item.id === updated.id ? updated : item))
  }

  const save = async () => {
    if (!currentBusiness || !preview) return
    if (!documentNumber.trim() || !description.trim()) {
      toast.error('Vui lòng nhập số chứng từ và diễn giải')
      return
    }
    if (Object.values(counts).some(value => value.quantity < 0 || value.unitValue < 0)) {
      toast.error('Số lượng và đơn giá không được âm')
      return
    }

    const date = new Date(`${occurredAt}T00:00:00`).toISOString()
    try {
      setSaving(true)
      if (!preview.isInitialized) {
        await initializeInventory(currentBusiness.id, {
          occurredAt: date,
          documentNumber: documentNumber.trim(),
          description: description.trim(),
          lines: preview.items.map(item => {
            const value = counts[keyOf(item.productId, item.ingredientId)]
            return {
              ...(item.productId ? { productId: item.productId } : { ingredientId: item.ingredientId! }),
              quantity: value.quantity,
              ...(value.quantity > 0 ? { totalValue: value.quantity * value.unitValue } : {})
            }
          })
        })
      } else {
        const reconciliation: ReconcileInventoryRequest = {
          occurredAt: date,
          documentNumber: documentNumber.trim(),
          description: description.trim(),
          lines: preview.items.map(item => {
            const value = counts[keyOf(item.productId, item.ingredientId)]
            const increase = value.quantity - item.currentQuantity
            return {
              ...(item.productId ? { productId: item.productId } : { ingredientId: item.ingredientId! }),
              actualQuantity: value.quantity,
              ...(increase > 0 ? { adjustmentInTotalValue: increase * value.unitValue } : {})
            }
          })
        }
        if (!preview.isStockTrackingEnabled) {
          await toggleStockTracking(currentBusiness.id, {
            isStockTrackingEnabled: true,
            reconciliation
          })
          updateBusinessTracking(true)
        } else {
          await reconcileInventory(currentBusiness.id, reconciliation)
        }
      }
      toast.success(
        !preview.isInitialized
          ? 'Đã khởi tạo tồn kho'
          : !preview.isStockTrackingEnabled
            ? 'Đã kiểm kê và bật lại quản lý tồn kho'
            : 'Đã cập nhật kiểm kê tồn kho'
      )
      await load()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể lưu dữ liệu tồn kho')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='mx-auto max-w-6xl p-6'>
      <div className='mb-5'>
        <h1 className='flex items-center gap-2 text-2xl font-bold text-gray-900'><ClipboardCheck className='text-[#9b0000]' /> {preview?.isInitialized ? 'Kiểm kê tồn kho' : 'Khởi tạo tồn kho lần đầu'}</h1>
        <p className='mt-1 text-sm text-gray-500'>
          {preview?.isInitialized
            ? 'Đếm hàng đang có thực tế để đối chiếu với số lượng TaxMate đang tính. Hàng mua mới phải tạo Phiếu nhập kho, không nhập tại đây.'
            : 'Nhập số lượng và đơn giá của hàng đang có khi bắt đầu theo dõi tồn kho trên TaxMate.'}
        </p>
      </div>

      {preview?.isInitialized ? (
        <div className='mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950'>
          {!preview.isStockTrackingEnabled ? (
            <p className='mb-2'><strong>Bật lại sau khi kiểm kê:</strong> TaxMate vẫn đã ghi các lần nhập và bán trong thời gian ẩn quản lý kho. Hãy nhập số thực tế hiện tại; quản lý kho chỉ được bật lại sau khi bạn lưu bước này.</p>
          ) : null}
          <p><strong>Cách xử lý chênh lệch:</strong> Thực tế nhiều hơn thì nhập đơn giá ước tính của riêng phần tăng thêm; thực tế ít hơn thì TaxMate tự định giá phần giảm khi chốt quý; bằng nhau thì không tạo điều chỉnh.</p>
        </div>
      ) : null}

      <div className='mb-4 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-3'>
        <label className='text-sm text-gray-600'>
          {preview?.isInitialized ? 'Ngày kiểm kê' : 'Ngày xác nhận tồn đầu'}
          <input type='date' value={occurredAt} onChange={e => setOccurredAt(e.target.value)} className='mt-1 block w-full rounded-lg border px-3 py-2' />
          {!preview?.isInitialized ? <span className='mt-1 block text-xs text-gray-500'>Ngày bạn kiểm đếm và bắt đầu theo dõi kho trên TaxMate.</span> : null}
        </label>
        <label className='text-sm text-gray-600'>Số chứng từ<input value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} className='mt-1 block w-full rounded-lg border px-3 py-2' /></label>
        <label className='text-sm text-gray-600'>Diễn giải<input value={description} onChange={e => setDescription(e.target.value)} className='mt-1 block w-full rounded-lg border px-3 py-2' /></label>
      </div>

      <div className='overflow-hidden rounded-xl border bg-white'>
        {loading ? <div className='flex justify-center p-12'><Loader2 className='animate-spin' /></div> : (
          <table className='w-full text-sm'>
            <thead className='bg-gray-50 text-gray-600'><tr><th className='px-4 py-3 text-left'>Mặt hàng</th>{preview?.isInitialized ? <th className='px-4 py-3 text-right'>Số lượng theo hệ thống</th> : null}<th className='px-4 py-3 text-right'>{preview?.isInitialized ? 'Số lượng đếm thực tế' : 'Số lượng tồn đầu'}</th><th className='px-4 py-3 text-right'>{preview?.isInitialized ? 'Đơn giá hàng tăng thêm' : 'Đơn giá tồn đầu'}</th></tr></thead>
            <tbody>{preview?.items.map(item => {
              const key = keyOf(item.productId, item.ingredientId)
              const value = counts[key] ?? { quantity: 0, unitValue: 0 }
              const difference = value.quantity - item.currentQuantity
              const needsValue = !preview.isInitialized ? value.quantity > 0 : difference > 0
              return <tr key={key} className='border-t'>
                <td className='px-4 py-3 font-medium'>{item.name}<span className='ml-2 text-xs text-gray-400'>{item.unit}</span></td>
                {preview.isInitialized ? <td className='px-4 py-3 text-right'>{item.currentQuantity.toLocaleString('vi-VN')}</td> : null}
                <td className='px-4 py-3'>
                  <input type='number' min={0} step='any' value={value.quantity} onFocus={e => e.currentTarget.select()} onChange={e => setCounts(old => ({ ...old, [key]: { ...value, quantity: Number(e.target.value) } }))} className='ml-auto block w-32 rounded-lg border px-3 py-2 text-right' />
                  {preview.isInitialized ? (
                    <div className={`mt-1 text-right text-xs ${difference > 0 ? 'text-blue-700' : difference < 0 ? 'text-amber-700' : 'text-gray-500'}`}>
                      {difference > 0 ? `Tăng ${difference.toLocaleString('vi-VN')}` : difference < 0 ? `Giảm ${Math.abs(difference).toLocaleString('vi-VN')}` : 'Khớp hệ thống'}
                    </div>
                  ) : null}
                </td>
                <td className='px-4 py-3'>
                  {needsValue ? (
                    <>
                      <input type='number' min={0} step='any' value={value.unitValue} onChange={e => setCounts(old => ({ ...old, [key]: { ...value, unitValue: Number(e.target.value) } }))} className='ml-auto block w-40 rounded-lg border px-3 py-2 text-right' />
                      {preview.isInitialized ? <div className='mt-1 text-right text-xs text-gray-500'>Chỉ áp dụng cho {difference.toLocaleString('vi-VN')} {item.unit ?? 'đơn vị'} tăng thêm</div> : null}
                    </>
                  ) : <div className='text-right text-gray-400'>Không cần nhập</div>}
                </td>
              </tr>
            })}</tbody>
          </table>
        )}
      </div>

      <div className='mt-4 flex justify-end'><button disabled={!preview || saving} onClick={save} className='rounded-lg bg-[#9b0000] px-5 py-2.5 font-semibold text-white disabled:opacity-50'>{saving ? 'Đang lưu...' : !preview?.isInitialized ? 'Xác nhận tồn đầu' : !preview.isStockTrackingEnabled ? 'Kiểm kê và bật quản lý tồn' : 'Lưu kiểm kê'}</button></div>
    </div>
  )
}
