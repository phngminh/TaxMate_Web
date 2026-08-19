import type {
  TaxDashboardApiResponse,
  TaxDashboardUiData,
  TaxQuarterApiStatus,
  TaxThresholdStatus
} from '../types/taxDashboard.type'

function getThresholdStatusLabel(
  status: TaxThresholdStatus
) {
  if (
    status === 'RequiredEInvoice'
  ) {
    return 'Đã vào diện kê khai'
  }

  return 'Chưa vào diện kê khai'
}

function getThresholdMessage(
  status: TaxThresholdStatus
) {
  if (status === 'RequiredEInvoice') {
    return 'Tổng doanh thu của chủ hộ đã vượt ngưỡng áp dụng. Bạn có thể thực hiện quy trình kê khai thuế theo quý.'
  }

  return 'Tổng doanh thu của chủ hộ chưa vượt ngưỡng áp dụng. TaxMate sẽ tiếp tục theo dõi doanh thu; quy trình kê khai thuế theo quý hiện chưa được mở.'
}

function getQuarterStatusLabel(
  status: TaxQuarterApiStatus
) {
  if (status === 'Completed') {
    return 'Đã kết thúc'
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

function formatQuarterRevenue(
  value: number
) {
  if (value <= 0) {
    return '-'
  }

  if (value >= 1_000_000_000) {
    const billionValue =
      value / 1_000_000_000

    return `${Number(
      billionValue.toFixed(2)
    )} tỷ`
  }

  if (value >= 1_000_000) {
    const millionValue =
      value / 1_000_000

    if (
      Number.isInteger(
        millionValue
      )
    ) {
      return `${millionValue}M`
    }

    return `${millionValue.toFixed(
      1
    )}M`
  }

  return value.toLocaleString(
    'vi-VN'
  )
}

export function mapTaxDashboardApiToUi(
  data: TaxDashboardApiResponse
): TaxDashboardUiData {
  return {
    year: data.year,

    warningMessage:
      getThresholdMessage(
        data.threshold.status
      ),

    thresholdAmount:
      data.threshold.amount,

    accumulatedRevenue:
      data.threshold
        .accumulatedRevenue,

    remainingAmount:
      data.threshold.remainingAmount,

    progressPercentage:
      data.threshold
        .progressPercentage,

    thresholdStatus:
      data.threshold.status,

    statusLabel:
      getThresholdStatusLabel(
        data.threshold.status
      ),

    forecastRevenue:
      data.forecast
        .estimatedYearEndRevenue,

    forecastBasedOn:
      data.forecast.label,

    quarters:
      data.quarters.map(
        (item) => ({
          id: `q${item.quarter}`,

          name:
            `Quý ${item.quarter}`,

          revenueText:
            formatQuarterRevenue(
              item.revenue
            ),

          statusText:
            getQuarterStatusLabel(
              item.status
            ),

          status:
            getQuarterUiStatus(
              item.status
            )
        })
      ),

    businesses:
      data.businesses.map(
        (business) => ({
          businessId:
            business.businessId,

          businessName:
            business.businessName,

          revenue:
            business.revenue
        })
      )
  }
}