const taxDateOptions: Intl.DateTimeFormatOptions = {
  timeZone: 'Asia/Bangkok'
}

function parseTaxPeriodDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00+07:00`)
  }

  // Tax-period APIs serialize naive UTC DateTimes without a timezone suffix.
  const isNaiveTimestamp = /^\d{4}-\d{2}-\d{2}T/.test(value)
    && !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
  return new Date(isNaiveTimestamp ? `${value}Z` : value)
}

export function formatTaxPeriodDate(value?: string | null) {
  if (!value) return 'Chưa xác định'
  const date = parseTaxPeriodDate(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('vi-VN', taxDateOptions)
}

export function formatTaxPeriodEndExclusive(value: string) {
  const date = parseTaxPeriodDate(value)
  if (Number.isNaN(date.getTime())) return value

  // The revenue window excludes its end instant; display the last included day.
  return new Date(date.getTime() - 1).toLocaleDateString('vi-VN', taxDateOptions)
}
