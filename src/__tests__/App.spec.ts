import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '../App.vue'
import HomeView from '../views/HomeView.vue'

describe('App', () => {
  it('render homepage properly', async () => {
    const Placeholder = { template: '<div />' }
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: HomeView },
        { path: '/chronicle', component: Placeholder },
        { path: '/about', component: Placeholder },
        { path: '/posts/:slug(.*)', component: Placeholder },
      ],
    })

    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), router],
      },
    })

    await router.isReady()

    expect(wrapper.text()).toContain('Rui∇abla')
    expect(wrapper.text()).toContain('近日信标')
  })
})
