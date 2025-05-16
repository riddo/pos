import { defineStore } from 'pinia'
import { usePage } from '@inertiajs/vue3'

interface User {
  id: number
  fullName: string
  email: string
  role?: Role
  [key: string]: any
}

interface Role {
  id: number
  name: string
  permissions: string[]
  [key: string]: any
}

interface PageProps {
  user?: User
  role?: Role
  permissions?: string[]
  [key: string]: any
}

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as User | null,
    role: null as Role | null,
    permissions: [] as string[],
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,

    hasPermission:
      (state) =>
      (permission: string): boolean => {
        return state.permissions.includes(permission)
      },

    getUserName: (state): string => {
      return state.user?.fullName || ''
    },

    getUserEmail: (state): string => {
      return state.user?.email || ''
    },

    getUserRole: (state): string => {
      return state.role?.name || ''
    },

    getAllPermissions: (state): string[] => {
      return state.permissions
    },
  },

  actions: {
    initialize() {
      const page = usePage()
      const props = page.props as PageProps

      if (props.user) {
        this.user = props.user
      }

      if (props.role) {
        this.role = props.role
      }

      if (props.permissions && Array.isArray(props.permissions)) {
        this.permissions = props.permissions
      }
    },

    logout() {
      this.user = null
      this.role = null
      this.permissions = []
    },
  },
})
