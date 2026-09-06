// Owner-wide changes also affect the currently selected business's profile.
let revision = 0
const listeners = new Set<() => void>()

export function notifyTaxProfileChanged() {
  revision += 1
  listeners.forEach((listener) => listener())
}

export function subscribeTaxProfileChanges(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function getTaxProfileRevision() {
  return revision
}
