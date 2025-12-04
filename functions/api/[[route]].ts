import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import posts from '../controller/posts'
import buildStatus from '../controller/buildStatus'
import auth from '../controller/auth'
import totp from '../controller/totp'
import passkey from '../controller/passkey'

const app = new Hono().basePath('/api')

app.route('/posts', posts)
app.route('/build-status', buildStatus)
app.route('/auth', auth)
app.route('/totp', totp)
app.route('/passkey', passkey)

export const onRequest = handle(app)
