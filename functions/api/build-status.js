const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const PROJECT_NAME = 'ruinabla'

export async function onRequest() {
  if (!API_TOKEN) {
    return new Response('API token not configured', { status: 500 })
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}/deployments?page=1&per_page=1`

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      return new Response(response.statusText, { status: response.status })
    }

    const data = await response.json()
    const latestDeployment = data.result[0]

    const result = {
      lastBuildTime: latestDeployment?.latest_stage?.ended_on || latestDeployment?.created_on,
      status: latestDeployment?.latest_stage?.status,
      isSuccessful:
        latestDeployment?.latest_stage?.status === 'success' ||
        latestDeployment?.latest_stage?.status === 'active',
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(`Internal Server Error: ${error.message}`, { status: 500 })
  }
}
