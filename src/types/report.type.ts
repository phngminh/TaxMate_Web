export interface BusinessProfileDropdownResponse {
  id: string
  businessName: string
}

export interface ActiveSalesMonthResponse {
  year: number
  month: number
  label: string
  totalOrders: number
  totalRevenue: number
}

export interface ActiveSalesQuarterResponse {
  year: number
  quarter: number
  label: string
  startMonth: number
  endMonth: number
  totalOrders: number
  totalRevenue: number
}

export interface SalesDashboardResponse {
  period: ReportPeriodResponse
  summary: SalesDashboardSummaryResponse
  revenueDistribution: ProductRevenueDistributionResponse[]
  topSellingProducts: TopSellingProductResponse[]
  salesTrend: SalesTrendResponse[]
}

export interface EstimatedProfitDashboardResponse {
  period: EstimatedProfitPeriodResponse
  summary: EstimatedProfitSummaryResponse
  profitTrend: EstimatedProfitTrendResponse[]
}

export interface CashFlowDashboardResponse {
  period: CashFlowPeriodResponse
  summary: CashFlowSummaryResponse
  expenseDistribution: ExpenseDistributionResponse[]
  cashFlowTrend: CashFlowTrendResponse[]
}

export interface TaxDashboardResponse {
  year: number
  threshold: TaxRevenueThresholdResponse
  eInvoiceThreshold: TaxRevenueThresholdResponse
  forecast: TaxRevenueForecastResponse
  quarters: TaxQuarterRevenueResponse[]
}

export interface ReportPeriodResponse {
  year: number
  month: number
  label: string
  startDate: string
  endDate: string
}

export interface SalesDashboardSummaryResponse {
  totalRevenue: number
  totalOrders: number
  totalProductsSold: number
}

export interface ProductRevenueDistributionResponse {
  productName: string
  revenue: number
  percentage: number
}

export interface TopSellingProductResponse {
  rank: number
  productName: string
  quantitySold: number
  revenue: number
}

export interface SalesTrendResponse {
  label: string
  currentQuarterRevenue: number
  previousQuarterRevenue: number
}

export interface EstimatedProfitPeriodResponse {
  year: number
  quarter: number
  label: string
  startMonth: number
  endMonth: number
}

export interface EstimatedProfitSummaryResponse {
  profit: number
  revenue: number
  costOfGoodsSold: number
}

export interface EstimatedProfitTrendResponse {
  month: number
  label: string
  profit: number
}

export interface CashFlowPeriodResponse {
  year: number
  quarter: number
  label: string
  startMonth: number
  endMonth: number
}

export interface CashFlowSummaryResponse {
  netAmount: number
  totalIncome: number
  totalExpense: number
}

export interface ExpenseDistributionResponse {
  categoryName: string
  amount: number
  percentage: number
}

export interface CashFlowTrendResponse {
  month: number
  label: string
  income: number
  expense: number
}

export interface TaxRevenueThresholdResponse {
  amount: number
  accumulatedRevenue: number
  remainingAmount: number
  progressPercentage: number
  status: string
}

export interface TaxRevenueForecastResponse {
  estimatedYearEndRevenue: number
  basedOnThroughQuarter: number
  label: string
}

export interface TaxQuarterRevenueResponse {
  quarter: number
  revenue: number
  status: string
}
