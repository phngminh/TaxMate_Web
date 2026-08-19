export type HomeDashboardGroupBy =
  | 'Day'
  | 'Week'
  | 'Month'

export interface HomeDashboardResponse {
  businessId: string
  businessName: string
  asOfDate: string

  summary: HomeDashboardSummary

  revenueTrend: HomeRevenueTrend

  revenueStructure: HomeRevenueStructure

  topProducts: HomeTopProducts
}

export interface HomeDashboardSummary {
  todayRevenue: {
    amount: number
    previousDayAmount: number
    changePercent: number
  }

  todayOrders: {
    count: number
    previousDayCount: number
    changePercent: number
    averageOrderValue: number
  }

  estimatedTax: {
    periodType: string
    year: number
    month: number
    periodLabel: string

    totalAmount: number

    isTaxable: boolean

    vat: {
      rate: number
      amount: number
    }

    personalIncomeTax: {
      rate: number
      amount: number
    }
  }

  estimatedProfit: {
    year: number
    month: number

    amount: number

    previousMonthAmount: number

    changePercent: number

    marginPercent: number
  }
}

export interface HomeRevenueTrend {
  fromDate: string
  toDate: string

  rangeDays: number

  groupBy: HomeDashboardGroupBy

  points: HomeRevenueTrendPoint[]
}

export interface HomeRevenueTrendPoint {
  date: string
  revenue: number
  trend: number
}

export interface HomeRevenueStructure {
  totalRevenue: number

  items: HomeRevenueStructureItem[]
}

export interface HomeRevenueStructureItem {
  categoryId: string | null
  categoryName: string

  revenue: number
  percentage: number
}

export interface HomeTopProducts {
  fromDate: string
  toDate: string

  items: HomeTopProductItem[]
}

export interface HomeTopProductItem {
  productId: string | null
  name: string

  revenue: number

  quantitySold: number
}