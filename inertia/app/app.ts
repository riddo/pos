/// <reference path="../../adonisrc.ts" />
/// <reference path="../../config/inertia.ts" />

import '../css/app.css'
import { createApp, h } from 'vue'
import type { DefineComponent } from 'vue'
import { createInertiaApp } from '@inertiajs/vue3'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { Link } from '@inertiajs/vue3'
import SettingsLayout from '~/pages/layouts/SettingsLayout.vue'
import AuthLayout from '~/pages/layouts/AuthLayout.vue'
import ProfileLayout from '~/pages/layouts/ProfileLayout.vue'
import DashboardLayout from '~/pages/layouts/DashboardLayout.vue'
import { createPinia } from 'pinia'

const appName = import.meta.env.VITE_APP_NAME || 'AdonisJS'

createInertiaApp({
  progress: { color: '#5468FF' },

  title: (title) => `${title} - ${appName}`,

  resolve: async (name) => {
    const page = await resolvePageComponent(
      `../pages/${name}.vue`,
      import.meta.glob<DefineComponent>('../pages/**/*.vue')
    )
    if (name.includes('settings')) {
      page.default.layout = SettingsLayout
    } else if (name.includes('auth')) {
      page.default.layout = AuthLayout
    } else if (name.includes('profile')) {
      page.default.layout = ProfileLayout

    } else {
      page.default.layout = DashboardLayout
    }
    return page
  },

  setup({ el, App, props, plugin }) {
    const app = createApp({ render: () => h(App, props) })
    app.use(createPinia())
    app.use(plugin)
    app.component('Link', Link)
    app.mount(el)
  },
})
