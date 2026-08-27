export type TaxFilingWindowCode =
  | 'FirstHalf'
  | 'SecondHalf'
  | 'Annual'

export type TaxFilingTaskStatus =
  | 'Upcoming'
  | 'Ready'
  | 'InProgress'
  | 'Completed'
  | 'Blocked'
  | 'NotApplicable'

export type TaxFilingTaskActionCode =
  | 'Open'
  | 'Continue'
  | 'View'
  | 'None'

export interface TaxFilingTaskBlocker {
  code: string
  message: string
}

export interface TaxFilingTask {
  taskId: string
  filingType: 'TKN'
  formCode: '01/TKN-CNKD'
  taxYear: number
  window: {
    code: TaxFilingWindowCode
    fromInclusive: string
    toExclusive: string
    label: string
  }
  deadline: string | null
  status: TaxFilingTaskStatus
  isOverdue: boolean
  reason: {
    code: string
    message: string
  }
  eligibility: {
    isEligible: boolean
    blockers: TaxFilingTaskBlocker[]
  }
  primaryAction: {
    code: TaxFilingTaskActionCode
    enabled: boolean
  }
  taxPeriodId: string | null
  updatedAt: string | null
}
