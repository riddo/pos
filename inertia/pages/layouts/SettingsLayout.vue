<script setup>
import { ref, onMounted } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { 
  Users, 
  ShieldCheck, 
  Settings as SettingsIcon,
  Package2,
  ArrowLeft
} from 'lucide-vue-next'
import LoadingLayout from './LoadingLayout.vue'
const { url, props } = usePage()
const user = props.user

const settingsItem = {
  id: 'settings',
  name: 'Configuración',
  icon: SettingsIcon,
  href: '/settings/employees',
  permission: 'view_settings'
}

const hasPermission = (permission) => {
  return user?.role?.permissions?.includes(permission) ?? false
}

const isLoading = ref(true)

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 500)
})

const settingsNavigation = [
  {
    id: 'employees',
    name: 'Empleados',
    icon: Users,
    href: '/settings/employees'
  },
  {
    id: 'roles',
    name: 'Roles y Permisos',
    icon: ShieldCheck,
    href: '/settings/roles'
  },
]
</script>

<template>
  <Toaster />
  <div>
    <Transition enter-active-class="transition-opacity duration-300" enter-from-class="opacity-0" enter-to-class="opacity-100" leave-active-class="transition-opacity duration-300" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <LoadingLayout v-if="isLoading" />
      <div v-else class="flex min-h-screen">
        <!-- Sidebar -->
        <aside class="hidden md:flex w-56 flex-col fixed inset-y-0 z-50 border-r">
          <div class="flex flex-col h-full py-4">
            <div class="px-3 py-2 flex flex-col gap-4">
              <div class="flex items-center">
                <h2 class="text-lg font-semibold text-center">Configuraciones</h2>
              </div>
              <nav class="space-y-1">
                <Link v-for="item in settingsNavigation" :key="item.id" :href="item.href" :class="[
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-slate-900 transition-all hover:text-slate-900 dark:text-slate-50 dark:hover:text-slate-50',
                  $page.url.startsWith(item.href) ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                ]">
                <component :is="item.icon" :class="['h-4 w-4', $page.url.startsWith(item.href) ? 'text-blue-800' : 'text-muted-foreground']" />
                <p :class="[$page.url.startsWith(item.href) ? 'text-slate-950 text-bold' : 'text-muted-foreground']">{{ item.name }}</p>
                </Link>
              </nav>
            </div>
            
            <!-- Botón Volver colocado al fondo de la sidebar -->
            <div class="mt-auto px-3 py-2">
              <Link href="/pos" class="flex items-center gap-3 rounded-lg px-3 py-2 bg-blue-50 text-blue-800 transition-all hover:bg-blue-100">
                <ArrowLeft class="h-4 w-4 text-blue-800" />
                <p class="text-blue-800 font-medium">Volver</p>
              </Link>
            </div>
          </div>
        </aside>

        <!-- Main content -->
        <main class="md:pl-60 flex-1">
          <div class="h-full py-8 px-0">
            <slot></slot>
          </div>
        </main>
      </div>
    </Transition>
  </div>
</template>