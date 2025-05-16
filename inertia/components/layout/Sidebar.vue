<script setup>
import { ref, computed, watch } from 'vue'
import { usePage, router } from '@inertiajs/vue3'
import { useUIStore } from '~/stores/ui'
import {
  Home,
  ShoppingCart,
  Package,
  Users2,
  LineChart,
  Settings,
  BadgeDollarSign,
  Package2,
  Store,
  Boxes,
  ChevronLeft,
  AlignJustify,
} from 'lucide-vue-next'

const page = usePage()
const { url } = page
const user = page.props.user
const activeLink = ref(url)
const uiStore = useUIStore()

// Observar cambios en la URL para actualizar el enlace activo
watch(() => page.url, (newUrl) => {
  activeLink.value = newUrl
}, { immediate: true })

const toggleSidebar = () => {
  uiStore.toggleSidebar()
}

const navigationItems = [
  {
    id: 'pos',
    name: 'Punto de venta',
    icon: ShoppingCart,
    href: '/pos',
    permission: 'view_sales_panel'
  },
  {
    id: 'products',
    name: 'Productos',
    icon: Package,
    href: '/products',
    permission: 'view_products'
  },
  {
    id: 'sales',
    name: 'Ventas',
    icon: BadgeDollarSign,
    href: '/sales',
    permission: 'view_sales_history'
  },
  {
    id: 'customers',
    name: 'Clientes',
    icon: Users2,
    href: '/customers',
    permission: 'view-customers'
  },
  {
    id: 'analytics',
    name: 'Análisis',
    icon: LineChart,
    href: '/analytics',
    permission: 'view-analytics'
  },
  {
    id: 'warehouses',
    name: 'Warehouses',
    icon: Store,
    href : '/warehouses',
    permission: 'view_warehouses'
  },
  {
    id: 'inventory',
    name: 'Movimientos',
    icon: Boxes,
    href: '/inventory/list',
    permission: 'view_movements'
  }
]

const settingsItem = {
  id: 'settings',
  name: 'Configuración',
  icon: Settings,
  href: '/settings/employees',
  permission: 'view_settings'
}

const hasPermission = (permission) => {
  const permissions = usePage().props.user.role.permissions || []
  return permissions.includes(permission)
}

// Determinar si un enlace está activo basado en la URL actual
const isLinkActive = (href) => {
  // Para enlaces exactos
  if (page.url === href) return true
  
  // Para secciones (enlaces que comienzan igual)
  if (href !== '/dashboard' && page.url.startsWith(href)) return true
  
  return false
}
</script>

<template>
  <aside v-if="user" :class="[
      'fixed inset-y-0 top-12 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-all duration-300',
      uiStore.isSidebarCollapsed ? 'w-[60px]' : 'w-[200px]'
    ]">
    <!-- Logo y botón de colapsar -->
    <div :class="['flex items-center px-2 pt-4 transition-all duration-300', uiStore.isSidebarCollapsed ? 'justify-center' : 'justify-end']">
      <button variant="ghost" size="icon" @click="toggleSidebar" class="rounded-lg transition-all duration-200 gap-2 hover:bg-transparent px-2" :class="[
          { 'rotate-180': uiStore.isSidebarCollapsed },
          uiStore.isSidebarCollapsed ? 'transform translate-x-0' : 'transform translate-x-2'
        ]">
        <AlignJustify class="h-6 w-6" />
      </button>
    </div>
    <!-- Main Navigation -->
    <nav class="flex flex-col gap-4 px-4 py-4">
      <template v-for="item in navigationItems" :key="item.id">
        <Link v-if="hasPermission(item.permission)" :href="item.href" :class="[
            'flex h-9 items-center rounded-lg transition-colors hover:text-foreground gap-2 md:h-8',
            isLinkActive(item.href) ? 'text-blue-800 hover:text-blue-800' : 'text-muted-foreground'
          ]">
        <component :is="item.icon" class="h-6 w-6 shrink-0" />
        <span :class="[
              'transition-opacity duration-300 whitespace-nowrap',
              uiStore.isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'
            ]">
          {{ item.name }}
        </span>
        </Link>
      </template>
    </nav>

    <!-- Settings Navigation -->
    <nav class="mt-auto flex flex-col gap-4 px-4 py-4">
      <Link v-if="hasPermission(settingsItem.permission)" :href="settingsItem.href" :class="[
          'flex h-9 items-center rounded-lg transition-colors hover:text-foreground gap-2 md:h-8',
          isLinkActive(settingsItem.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
        ]">
      <component :is="settingsItem.icon" :class="['h-6 w-6 shrink-0', isLinkActive(settingsItem.href) ? 'text-blue-800' : 'text-muted-foreground hover:text-blue-800']" />
      <span :class="[
            'transition-opacity duration-300 whitespace-nowrap',
            uiStore.isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100',
            isLinkActive(settingsItem.href) ? 'text-accent-foreground' : ''
          ]">
        {{ settingsItem.name }}
      </span>
      </Link>
    </nav>
  </aside>
</template>
