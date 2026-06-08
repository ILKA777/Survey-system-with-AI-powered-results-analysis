import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Детерминированный in-memory localStorage (окружение не всегда даёт полный Storage API).
function createLocalStorage() {
  let store = {}
  return {
    getItem: key => (key in store ? store[key] : null),
    setItem: (key, value) => { store[key] = String(value) },
    removeItem: key => { delete store[key] },
    clear: () => { store = {} },
    key: i => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length },
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: createLocalStorage(),
  writable: true,
  configurable: true,
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})
