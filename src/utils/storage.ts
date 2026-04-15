function getStorage(): Storage | null {
  if (typeof globalThis === 'undefined') {
    return null
  }

  const storage = globalThis.localStorage
  if (
    storage &&
    typeof storage.getItem === 'function' &&
    typeof storage.setItem === 'function' &&
    typeof storage.removeItem === 'function'
  ) {
    return storage
  }

  return null
}

export function getStoredItem(key: string): string | null {
  return getStorage()?.getItem(key) ?? null
}

export function setStoredItem(key: string, value: string) {
  getStorage()?.setItem(key, value)
}

export function removeStoredItem(key: string) {
  getStorage()?.removeItem(key)
}

export function clearStoredItems() {
  getStorage()?.clear()
}
