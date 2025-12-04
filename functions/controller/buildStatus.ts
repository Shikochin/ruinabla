import { Hono } from 'hono'

type Bindings = {
  CLOUDFLARE_API_TOKEN: string
  CLOUDFLARE_ACCOUNT_ID: string
}

const buildStatus = new Hono<{ Bindings: Bindings }>()

buildStatus.get('/', async (c) => {
  const API_TOKEN = c.env.CLOUDFLARE_API_TOKEN
  const ACCOUNT_ID = c.env.CLOUDFLARE_ACCOUNT_ID
  const PROJECT_NAME = 'ruinabla'

  if (!API_TOKEN || !ACCOUNT_ID) {
    return c.text('Required environment variables are not configured.', 500)
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

    return c.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Cloudflare API request failed:', error)
    return c.text('Failed to retrieve build status from Cloudflare API.', 500)
  }
})

export default buildStatus
