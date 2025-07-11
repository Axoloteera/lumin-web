import { Hono } from 'hono'
import { App } from '@octokit/app'
import { request } from '@octokit/request'
import JSZip from 'jszip'
import crypto from 'crypto'

const github = new Hono()

function verifySignature(secret: string, payload: string, signature?: string | null) {
  if (!secret || !signature) return false
  const hmac = crypto.createHmac('sha256', secret)
  hmac.update(payload)
  const expected = 'sha256=' + hmac.digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

async function processPush(body: any) {
  const installationId = body.installation?.id
  const repo = body.repository
  const commitSha = body.after
  if (!installationId || !repo) return

  const app = new App({
    appId: Number(process.env.GITHUB_APP_ID),
    privateKey: (process.env.GITHUB_APP_PRIVATE_KEY || '').replace(/\\n/g, '\n')
  })
  const token = await app.getInstallationAccessToken(Number(installationId))

  const { data: checkRun } = await request('POST /repos/{owner}/{repo}/check-runs', {
    headers: {
      authorization: `token ${token}`,
      accept: 'application/vnd.github+json'
    },
    owner: repo.owner.login,
    repo: repo.name,
    name: 'Process repo zip',
    head_sha: commitSha,
    status: 'in_progress'
  }) as any

  const zipRes = await request('GET /repos/{owner}/{repo}/zipball/{ref}', {
    headers: {
      authorization: `token ${token}`,
      accept: 'application/vnd.github+json'
    },
    owner: repo.owner.login,
    repo: repo.name,
    ref: commitSha
  })
  const buffer = Buffer.from(zipRes.data as unknown as ArrayBuffer)
  await JSZip.loadAsync(buffer)

  await request('PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}', {
    headers: {
      authorization: `token ${token}`,
      accept: 'application/vnd.github+json'
    },
    owner: repo.owner.login,
    repo: repo.name,
    check_run_id: checkRun.id,
    status: 'completed',
    conclusion: 'success'
  })
}

github.post('/gh_callback', async (c) => {
  const signature = c.req.header('x-hub-signature-256')
  const event = c.req.header('x-github-event')
  const payload = await c.req.text()

  if (!verifySignature(process.env.GITHUB_WEBHOOK_SECRET || '', payload, signature)) {
    return c.json({ error: 'invalid signature' }, 401)
  }

  if (event === 'push') {
    const body = JSON.parse(payload)
    await processPush(body)
  }

  return c.json({ ok: true })
})

github.post('/_private/_webhook', async (c) => {
  const body = await c.req.json()
  await processPush(body)
  return c.json({ ok: true })
})

export default github
