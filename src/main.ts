import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css'
import './assets/prism-gruvbox-dark.css'

import { createHead } from '@unhead/vue/client'

import i18n from './i18n'

const app = createApp(App)

app.use(createHead())
app.use(createPinia())
app.use(router)
app.use(i18n)

app.mount('#app')
