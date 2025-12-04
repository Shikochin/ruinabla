import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import posts from '../controller/posts'
import buildStatus from '../controller/buildStatus'

const app = new Hono().basePath('/api')

app.route('/posts', posts)
app.route('/build-status', buildStatus)

export const onRequest = handle(app)
