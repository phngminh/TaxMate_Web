import type {
  TaxDashboardApiResponse,
  TaxDashboardUiData,
  TaxQuarterApiStatus,
  TaxThresholdStatus
} from '../types/taxDashboard.type'

function getThresholdStatusLabel(
  status: TaxThresholdStatus
) {
  if (status === 'Required') {
    return 'Bắt buộc'
  }

  return 'Chưa bắt buộc'
}

function getThresholdMessage(
  status: TaxThresholdStatus
) {
  if (status === 'Required') {
    return 'Doanh thu năm đã đạt hoặc vượt ngưỡng 1 tỷ đồng. Bạn cần sử dụng hóa đơn điện tử khởi tạo từ máy tính tiền kết nối cơ quan thuế.'
  }

  return 'Theo quy định, khi doanh thu trên 1 tỷ đồng/năm, bạn cần sử dụng hóa đơn điện tử khởi tạo từ máy tính tiền kết nối cơ quan thuế.'
}

function getQuarterStatusLabel(
  status: TaxQuarterApiStatus
) {
  if (status === 'Completed') {
    return 'Bình thường'
  }

  if (status === 'Current') {
    return 'Đang diễn ra'
  }

  return 'Chưa đến'
}

function getQuarterUiStatus(
  status: TaxQuarterApiStatus
) {
  if (status === 'Current') {
    return 'in_progress' as const
  }

  if (status === 'Upcoming') {
    return 'upcoming' as const
  }

  return 'normal' as const
}

function formatQuarterRevenue(value: number) {
  if (value <= 0) {
    return '-'
  }

  if (value >= 1_000_000) {
    const millionValue =
      value / 1_000_000

    if (Number.isInteger(millionValue)) {
      return `${millionValue}M`
    }

    return `${millionValue.toFixed(1)}M`
  }

  return value.toLocaleString('vi-VN')
}

export function mapTaxDashboardApiToUi(
  data: TaxDashboardApiResponse
): TaxDashboardUiData {
  return {
    year: data.year,

    warningMessage:
      getThresholdMessage(data.threshold.status),

    thresholdAmount:
      data.threshold.amount,

    accumulatedRevenue:
      data.threshold.accumulatedRevenue,

    remainingAmount:
      data.threshold.remainingAmount,

    progressPercentage:
      data.threshold.progressPercentage,

    thresholdStatus:
      data.threshold.status,

    statusLabel:
      getThresholdStatusLabel(
        data.threshold.status
      ),

    forecastRevenue:
      data.forecast.estimatedYearEndRevenue,

    forecastBasedOn:
      data.forecast.label,

    quarters:
      data.quarters.map((item) => ({
        id: `q${item.quarter}`,
        name: `Quý ${item.quarter}`,
        revenueText:
          formatQuarterRevenue(item.revenue),
        statusText:
          getQuarterStatusLabel(item.status),
        status:
          getQuarterUiStatus(item.status)
      }))
  }
}