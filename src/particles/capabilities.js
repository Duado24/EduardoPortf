export function canvasRendererReason() {
  if (navigator.connection?.saveData) return 'data-saving'
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return 'low-memory'
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return 'low-concurrency'
  return null
}
