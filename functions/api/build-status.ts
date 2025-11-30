interface Env {
  CLOUDFLARE_API_TOKEN: string
  CLOUDFLARE_ACCOUNT_ID: string
}

export async function onRequest(context: EventContext<Env, any, Record<string, any>>) {
  const API_TOKEN = context.env.CLOUDFLARE_API_TOKEN
  const ACCOUNT_ID = context.env.CLOUDFLARE_ACCOUNT_ID

  const PROJECT_NAME = 'ruinabla'

  if (!API_TOKEN || !ACCOUNT_ID) {
    return new Response('Required environment variables are not configured.', { status: 500 })
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

    const data = await response.json()
    const latestDeployment = data.result?.[0]

    const result = {
      lastBuildTime:
        latestDeployment?.latest_stage?.ended_on || latestDeployment?.created_on || null,
      status: latestDeployment?.latest_stage?.status || 'unknown',
      isSuccessful:
        latestDeployment?.latest_stage?.status === 'success' ||
        latestDeployment?.latest_stage?.status === 'active',
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Cloudflare API request failed:', error)
    return new Response('Failed to retrieve build status from Cloudflare API.', { status: 500 })
  }
}
