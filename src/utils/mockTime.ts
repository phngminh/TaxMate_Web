const OriginalDate = window.Date

const MOCK_TIME_KEY = 'demo_mock_time'
const MOCK_TIME_SET_AT_KEY = 'demo_mock_time_set_at'
export const MOCK_TIME_CHANGED_EVENT = 'demo_time_changed'

let revision = 0
const listeners = new Set<() => void>()

function bumpRevision() {
  revision += 1
  listeners.forEach((listener) => listener())
}

export function subscribeMockTimeChanges(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getMockTimeRevision() {
  return revision
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function toLocalDateTimeValue(ts: number) {
  const date = new OriginalDate(ts)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function toLocalDateValue(ts: number) {
  const date = new OriginalDate(ts)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function parseMockTimeString(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value.trim())
  if (match) {
    return new OriginalDate(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6] || 0)
    ).getTime()
  }

  const parsed = new OriginalDate(value).getTime()
  return Number.isNaN(parsed) ? null : parsed
}

export function getMockTimeString(): string | null {
  try {
    return localStorage.getItem(MOCK_TIME_KEY)
  } catch {
    return null
  }
}

export function getMockTimestamp(): number | null {
  try {
    const mockTimeStr = localStorage.getItem(MOCK_TIME_KEY)
    if (!mockTimeStr) return null

    const baseTime = parseMockTimeString(mockTimeStr)
    if (baseTime === null) return null

    const setAtStr = localStorage.getItem(MOCK_TIME_SET_AT_KEY)
    const setAt = setAtStr ? Number(setAtStr) : null

    if (setAt && !Number.isNaN(setAt)) {
      return baseTime + (OriginalDate.now() - setAt)
    }
    return baseTime
  } catch {
    return null
  }
}

export function getMockTimeIso(): string | null {
  const timestamp = getMockTimestamp()
  if (timestamp === null) return null
  return new OriginalDate(timestamp).toISOString()
}

export function getMockLocalDateString(): string | null {
  const timestamp = getMockTimestamp()
  if (timestamp === null) return null
  return toLocalDateValue(timestamp)
}

export function getAppDateInputValue(): string {
  const timestamp = getMockTimestamp() ?? OriginalDate.now()
  return toLocalDateValue(timestamp)
}

export function getMockTimeInputValue(): string {
  const stored = getMockTimeString()
  if (!stored) return ''
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(stored)) return stored.slice(0, 16)
  const timestamp = getMockTimestamp()
  return timestamp !== null ? toLocalDateTimeValue(timestamp) : ''
}

export function setMockTime(timeStr: string | null) {
  try {
    if (timeStr && timeStr.trim()) {
      localStorage.setItem(MOCK_TIME_KEY, timeStr.trim())
      localStorage.setItem(MOCK_TIME_SET_AT_KEY, OriginalDate.now().toString())
    } else {
      localStorage.removeItem(MOCK_TIME_KEY)
      localStorage.removeItem(MOCK_TIME_SET_AT_KEY)
    }
  } catch (err) {
    console.error('[MockTime] Error setting mock time:', err)
  }
  bumpRevision()
  window.dispatchEvent(new CustomEvent(MOCK_TIME_CHANGED_EVENT, { detail: timeStr }))
}

export function resetMockTime() {
  setMockTime(null)
}

export function isMockTimeActive(): boolean {
  return !!getMockTimeString()
}

export function initMockTime() {
  if ((window as any).__MOCK_TIME_INITIALIZED__) return
  ;(window as any).__MOCK_TIME_INITIALIZED__ = true

  function constructOriginalDate(args: any[]) {
    if (args.length === 0) return new OriginalDate()
    if (args.length === 1) return new OriginalDate(args[0])
    return new OriginalDate(
      args[0],
      args[1],
      args[2] ?? 1,
      args[3] ?? 0,
      args[4] ?? 0,
      args[5] ?? 0,
      args[6] ?? 0
    )
  }

  const ProxyDate: any = function (this: Date, ...args: any[]) {
    const constructArgs =
      args.length === 0
        ? (() => {
            const mockTs = getMockTimestamp()
            return mockTs !== null ? [mockTs] : []
          })()
        : args

    const instance = constructOriginalDate(constructArgs)
    if (!(this instanceof ProxyDate)) {
      return instance.toString()
    }
    return instance
  }

  Object.setPrototypeOf(ProxyDate, OriginalDate)
  ProxyDate.prototype = Object.create(OriginalDate.prototype)
  ProxyDate.prototype.constructor = ProxyDate

  ProxyDate.now = function () {
    const mockTs = getMockTimestamp()
    return mockTs !== null ? mockTs : OriginalDate.now()
  }
  ProxyDate.parse = OriginalDate.parse
  ProxyDate.UTC = OriginalDate.UTC

  Object.defineProperty(ProxyDate, Symbol.hasInstance, {
    value: (instance: any) => instance instanceof OriginalDate
  })

  window.Date = ProxyDate
}

initMockTime()
