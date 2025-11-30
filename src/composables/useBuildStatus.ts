const PROXY_API_ENDPOINT = '/api/build-status'

interface BuildInfo {
  lastBuildTime: string | null
  status: 'idle' | 'building' | 'deploying' | 'active' | 'success' | 'failure' | string
  isSuccessful: boolean
}

interface FormattedBuildResult {
  buildTime: Date | null
  isSuccessful: boolean
  statusText: string
}

export async function getLatestBuildStatusFromProxy(): Promise<FormattedBuildResult> {
  const defaultResult: FormattedBuildResult = {
    buildTime: null,
    isSuccessful: false,
    statusText: 'Unknown or Failed to Load',
  }

  try {
    const response = await fetch(`https://shikoch.in${PROXY_API_ENDPOINT}`, {
      method: 'GET',
    })

    if (!response.ok) {
      console.error(`Proxy API Error: Status ${response.status} - ${response.statusText}`)
      return {
        ...defaultResult,
        statusText: `API Error (${response.status})`,
      }
    }

    const data: BuildInfo = await response.json()

    const buildTime = data.lastBuildTime ? new Date(data.lastBuildTime) : null

    const statusText = data.status

    return {
      buildTime: buildTime,
      isSuccessful: data.isSuccessful,
      statusText: statusText,
    }
  } catch (error) {
    console.error('Network or parsing error when calling build status proxy:', error)
    return {
      ...defaultResult,
      statusText: 'Network Connection Failed',
    }
  }
}
