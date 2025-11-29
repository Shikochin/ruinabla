import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css'
// twoslash style
import './assets/twoslash.css'

import { createHead } from '@unhead/vue/client'

const app = createApp(App)

app.use(createHead())
app.use(createPinia())
app.use(router)

app.mount('#app')
