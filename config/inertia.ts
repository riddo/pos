import { defineConfig } from '@adonisjs/inertia'
import type { InferSharedProps, PageProps } from '@adonisjs/inertia/types'

const inertiaConfig = defineConfig({
  /**
   * Path to the Edge view that will be used as the root view for Inertia responses
   */
  rootView: 'inertia_layout',

  /**
   * Data that should be shared with all rendered pages
   */
  sharedData: {
    success: (ctx) => ctx.inertia.always(() => ctx.session?.flashMessages.get('success')),
    errors: (ctx) => ctx.inertia.always(() => ctx.session?.flashMessages.get('errors')),
    bulkUploadErrors: (ctx) =>
      ctx.inertia.always(() => ctx.session?.flashMessages.get('bulkUploadErrors')),
    user: async (ctx) => {
      const user = ctx.auth.user
      if (user) {
        await user.load('role', (query) => {
          query.preload('permissions')
        })
        return {
          ...user.toJSON(),
          role: {
            ...user.role.toJSON(),
            permissions: user.role.permissions.map((p) => p.permissionsName),
          },
        }
      }
      return user
    },
  },

  /**
   * Options for the server-side rendering
   */
  ssr: {
    enabled: false,
    entrypoint: 'inertia/app/ssr.ts',
  },
})

export default inertiaConfig

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig>, PageProps {}
}
