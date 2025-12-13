import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

interface FetchOptions extends RequestInit {
  params?: Record<string, string>
  skipInterceptor?: boolean
}

export async function http(url: string, options: FetchOptions = {}) {
  const auth = useAuthStore()

  // URL processing
  let requestUrl = url
  if (options.params) {
    const params = new URLSearchParams(options.params)
    requestUrl += `?${params.toString()}`
  }

  // Headers processing
  const headers = new Headers(options.headers)

  // Auto-inject Authorization header
  if (auth.sessionId && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${auth.sessionId}`)
  }

  // Default to json content type if body is present and not FormData
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    try {
      JSON.parse(options.body)
      headers.set('Content-Type', 'application/json')
    } catch {
      // Not JSON, ignore
    }
  }

  const config = {
    ...options,
    headers,
  }

  const response = await fetch(requestUrl, config)

  // Handle 401 Unauthorized
  if (response.status === 401 && !options.skipInterceptor) {
    const toast = useToastStore()
    toast.error('Session expired. Please login again.')
    await auth.logout()
    window.location.href = '/login'
    return Promise.reject(new Error('Session expired'))
  }

  return response
}
