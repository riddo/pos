import { createInertiaApp, Link } from '@inertiajs/vue3'
import { renderToString } from '@vue/server-renderer'
import { resolve } from 'node:path'
import { createSSRApp, h, type DefineComponent } from 'vue'

export default function render(page: any) {
  return createInertiaApp({
    page,
    render: renderToString,
    resolve: (name) => {
      const pages = import.meta.glob<DefineComponent>('../pages/**/*.vue', { eager: true })
      const resolvedPaged = pages[`../pages/${name}.vue`]
      return resolvedPaged
    },

    setup({ App, props, plugin }) {
      return createSSRApp({ render: () => h(App, props) })
        .use(plugin)
        .component('Link', Link)
    },
  })
}
