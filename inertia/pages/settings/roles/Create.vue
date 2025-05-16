<script setup>
import { ref, computed } from 'vue'
import { useForm, router } from '@inertiajs/vue3'
import { ArrowLeft, Save, Check, ChevronDown, Settings, Store, Boxes, Shield } from 'lucide-vue-next'
import SettingsLayout from '~/pages/layouts/SettingsLayout.vue'
import { useToast } from '~/components/ui/toast/use-toast'

const props = defineProps({
  permissions: {
    type: Array,
    required: true,
  },
})

const form = useForm({
  rol: '',
  permissions: [],
})

const activeSection = ref('ventas')

const permissionCategories = [
  { 
    id: 'ventas', 
    name: 'Ventas', 
    icon: 'dollar-sign',
    description: 'Brinda acceso para realizar transacciones de ventas',
    active: true 
  },
  { 
    id: 'productos', 
    name: 'Productos', 
    icon: 'package',
    description: 'Administración del catálogo de productos',
    active: true 
  },
  {
    id: 'sucursales',
    name: 'Sucursales y bodegas',
    icon: Store,
    description: 'Administracion de las sucursales y bodegas de la empresa',
    active: true
  },
  {
    id: 'inventario',
    name: 'Inventario',
    icon: Boxes,
    description: 'Administracion de inventario de las sucursales',
    active: true
  },
  {
    id: 'configuraciones',
    name: 'Configuraciones',
    description: 'Administración de las configuraciones del dashboard',
    active: true
  }
]

const { toast } = useToast()
const getPermissionId = (permissionName) => {
  const permission = props.permissions.find(p => p.permissionsName === permissionName)
  return permission ? permission.id : null
}

const togglePermission = (permissionName) => {
  const id = getPermissionId(permissionName)
  if (!id) return

  const index = form.permissions.indexOf(id)
  if (index === -1) {
    form.permissions.push(id)
  } else {
    form.permissions.splice(index, 1)
  }
}

const createRole = () => {
  form.post('/settings/roles', {
    onSuccess: () => {
      router.visit('/settings/roles')
      toast({
        title: 'Rol creado correctamente',
        description: 'El rol ha sido creado correctamente',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error al crear el rol',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

const setActiveSection = (sectionId) => {
  activeSection.value = sectionId
}

// Permisos agrupados por categoría
const permissionGroups = {
  ventas: {
    title: 'OPERACIONES BÁSICAS DE VENTAS',
    permissions: {
      'view_sales_panel': 'Ver Panel de ventas',
      'post_sales': 'Realizar Venta',
      'view_sales_history': 'Ver historial de ventas',
      'view_sale_details': 'Ver detalle de ventas',
    }
  },
  productos: {
    title: 'GESTIÓN DE PRODUCTOS',
    permissions: {
      'view_products': 'Ver Productos',
      'create_products': 'Agregar Productos',
      'edit_products': 'Editar Productos',
      'delete_products': 'Eliminar productos'
    }
  },
  sucursales: {
    title: 'GESTIÓN DE SUCURSALES Y BODEGAS',
    permissions: {
      'view_warehouses': 'Ver Bodegas',
      'create_warehouses': 'Crear Bodegas',
      'edit_warehouses': 'Editar Bodegas',
    }
  },
  inventario: {
    title: 'GESTIÓN DE INVENTARIO',
    permissions: {
      'view_inventory': 'Ver Inventario',
      'do_movements': 'Realizar Movimientos',
      'view_movements': 'Ver Movimientos',
    }
  },
  configuraciones: {
    title: 'CONFIGURACIONES DEL DASHBOARD',
    permissions: {
      'view_settings': 'Ver Configuraciones',
      'manage_roles': 'Gestionar roles',
      'manage_users': 'Gestionar usuarios',
    }
  }
}
</script>

<template>

  <Head title="Crear Rol" />
  <div class="flex bg-background">

    <!-- Contenido principal -->
    <div class="flex-1 overflow-auto">
      <div class="max-w-5xl mx-auto p-6">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-blue-100 p-2">
              <Shield class="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 class="text-2xl font-bold tracking-tight">Crear Nuevo Rol</h2>
              <p class="text-muted-foreground mt-2">
                Crea un nuevo rol y asigna sus permisos
              </p>
            </div>
          </div>
          <Button variant="outline" @click="router.visit('/settings/roles')">
            <ArrowLeft class="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>

        <form @submit.prevent="createRole" class="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Ingresa el nombre para identificar este rol
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div class="grid w-full max-w-xl gap-4">
                <div class="space-y-2">
                  <Label>Nombre del Rol</Label>
                  <Input v-model="form.rol" placeholder="Ej: Vendedor, Supervisor..." required />
                </div>
              </div>
            </CardContent>
          </Card>
          <div class="flex">
            <div class="w-64 border-r bg-muted/20">
              <div class="p-4">
                <h2 class="text-xl font-semibold">Permisos</h2>
              </div>
              <div class="space-y-1 p-2">
                <Button type="button" v-for="category in permissionCategories" :key="category.id" variant="ghost" :class="[
                        'w-full justify-start gap-2 px-3 py-2',
                        activeSection === category.id ? 'bg-accent text-accent-foreground' : ''
                    ]" @click="setActiveSection(category.id)">
                  <component :is="category.id === 'ventas' ? 'dollar-sign' : category.id === 'productos' ? 'package' : 'Settings'" class="h-4 w-4" />
                  {{ category.name }}
                  <Badge v-if="!category.active" variant="outline" class="ml-auto">Inactivo</Badge>
                </Button>
              </div>
            </div>

            <!-- Contenido de permisos según la sección activa -->
            <Card class="w-full ml-4">
              <CardHeader>
                <CardTitle>{{ permissionCategories.find(c => c.id === activeSection)?.name }}</CardTitle>
                <CardDescription>
                  {{ permissionCategories.find(c => c.id === activeSection)?.description }}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div v-if="permissionGroups[activeSection]">
                  <h3 class="text-base font-medium text-muted-foreground mb-4">
                    {{ permissionGroups[activeSection].title }}
                  </h3>
                  <div class="space-y-4">
                    <div v-for="(label, name) in permissionGroups[activeSection].permissions" :key="name" class="flex items-center space-x-3 py-2">
                      <Checkbox 
                        :id="name" 
                        :checked="form.permissions.includes(getPermissionId(name))" 
                        @update:checked="togglePermission(name)"
                        class="checkbox-blue"
                      />
                      <div class="grid gap-1.5 leading-none">
                        <Label :for="name" class="text-base">{{ label }}</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div v-else class="py-4 text-center text-muted-foreground">
                  Selecciona una categoría para ver los permisos disponibles
                </div>
              </CardContent>
            </Card>
          </div>

          <div class="flex justify-end gap-4 mt-8">
            <Button type="button" variant="outline" @click="router.visit('/roles')">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              class="badge-info"
              :disabled="form.processing || !form.rol || form.permissions.length === 0"
            >
              <Save class="mr-2 h-4 w-4" />
              Crear Rol
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style>
.badge-info {
  background-color: #dbeafe !important;
  color: #1e40af !important;
  border-color: #bfdbfe !important;
}

.badge-info:hover {
  background-color: #bfdbfe !important;
  color: #1e40af !important;
}

/* Estilos para los checkbox */
.checkbox-blue {
  color: #1e40af !important;
  background-color: white !important;
  border-color: #93c5fd !important; /* border-blue-300 */
  overflow: hidden; /* Ocultar contenido que sobresale */
}

/* Cuando está seleccionado */
.checkbox-blue[data-state="checked"] {
  background-color: #dbeafe !important; /* bg-blue-100 */
  border-color: #93c5fd !important; /* border-blue-300 */
  color: #1e40af !important; /* text-blue-800 */
  position: relative;
  overflow: visible; /* Permitir que el check sea visible */
}

/* Para el ícono de check dentro del checkbox */
.checkbox-blue[data-state="checked"]::after {
  content: "✓";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  color: #1e40af;
  display: flex !important;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* Ocultar cualquier elemento interactivo adicional dentro de los checkboxes */
.checkbox-blue > * {
  display: none !important;
}

/* Asegurar que solo se muestra el checkbox real */
.checkbox-blue div[role="checkbox"] {
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

/* Asegurar que el tamaño del checkbox es consistente */
.checkbox-blue {
  width: 16px !important;
  height: 16px !important;
  min-width: 16px !important;
  min-height: 16px !important;
  position: relative;
  display: inline-block;
  border: 1px solid #93c5fd;
  border-radius: 4px;
  cursor: pointer;
  background-color: white;
}

/* Restaurar la interactividad del checkbox */
.checkbox-blue {
  pointer-events: auto !important;
  cursor: pointer !important;
}

/* Asegurar que solo se muestra el ícono de check cuando está seleccionado */
.checkbox-blue[data-state="checked"]::after {
  content: "✓";
  position: absolute;
  color: #1e40af;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

/* Ocultar cualquier elemento interactivo adicional dentro de los checkboxes */
.checkbox-container {
  pointer-events: auto;
  cursor: pointer;
}

/* Estilo para cuando está enfocado */
.checkbox-blue:focus-visible {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px #dbeafe !important; /* ring-blue-100 */
}

/* Asegurar que los símbolos SVG internos estén ocultos */
.checkbox-blue svg {
  display: none !important;
}

/* Eliminar cualquier indicador visual duplicado */
.checkbox-blue::before {
  display: none !important;
}

/* Eliminar cualquier estilo adicional que pueda causar problemas */
.checkbox-blue[data-state="checked"]::before {
  display: none !important;
}

/* Corregir tamaño y centrado del check */
.checkbox-blue {
  position: relative;
  display: flex !important;
  align-items: center;
  justify-content: center;
}

/* Soluciona el problema de los tickets que aparecen fuera del checkbox */
.checkbox-blue {
  position: relative !important;
  isolation: isolate !important;
}

/* Asegurarse de que todos los elementos dentro del checkbox estén absolutamente posicionados */
.checkbox-blue > * {
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  opacity: 0 !important;
}

/* Completamente reemplazar el checkbox con un estilo propio */
.checkbox-blue {
  display: inline-block !important;
  width: 16px !important;
  height: 16px !important;
  min-width: 16px !important;
  min-height: 16px !important;
  border: 1px solid #93c5fd !important;
  border-radius: 4px !important;
  background-color: #fff !important;
  cursor: pointer !important;
  overflow: hidden !important;
}

/* Estilo para el estado checked */
.checkbox-blue[data-state="checked"] {
  background-color: #dbeafe !important;
  border-color: #93c5fd !important;
  position: relative !important;
}

/* Crear un nuevo check icon desde cero */
.checkbox-blue[data-state="checked"]::after {
  content: "✓" !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  color: #1e40af !important;
  font-size: 12px !important;
  line-height: 1 !important;
}

/* Ocultar todos los SVGs y otros contenidos dentro del checkbox */
.checkbox-blue svg,
.checkbox-blue img,
.checkbox-blue path {
  display: none !important;
  visibility: hidden !important;
}
</style>
