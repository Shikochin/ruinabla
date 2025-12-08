import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import posts from '../controller/posts'
import auth from '../controller/auth'
import totp from '../controller/totp'
import passkey from '../controller/passkey'
import friends from '../controller/friends'

const app = new Hono().basePath('/api')

app.route('/posts', posts)
app.route('/auth', auth)
app.route('/totp', totp)
app.route('/passkey', passkey)
app.route('/friends', friends)

export const onRequest = handle(app)
