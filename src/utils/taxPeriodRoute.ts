export function taxPeriodDetailPath(
  taxPeriodId: string
) {
  return `/business-owner/tax-period/${taxPeriodId}`
}

export function taxPeriodPreviewPath(
  taxPeriodId: string
) {
  return `/business-owner/tax-period/${taxPeriodId}/preview`
}

export function taxPeriodCalculationPath(
  taxPeriodId: string
) {
  return `/business-owner/tax-period/${taxPeriodId}/calculation`
}

export function taxPeriodDeclarationPath(
  taxPeriodId: string
) {
  return `/business-owner/tax-period/${taxPeriodId}/declaration`
}