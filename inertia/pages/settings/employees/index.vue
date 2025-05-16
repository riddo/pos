<script setup>
import { ref, computed } from 'vue'
import { useForm, router } from '@inertiajs/vue3'
import SettingsLayout from '../../layouts/SettingsLayout.vue'
import { Plus, Trash2, Mail, Pencil, UserPlus, Users, Search, AlertCircle, User, Filter } from 'lucide-vue-next'
import { useToast } from '~/components/ui/toast/use-toast'
import { usePage } from '@inertiajs/vue3'

const props = defineProps({
  employees: {
    type: Array,
    required: true,
  },
  roles: {
    type: Array,
    required: true,
  },
})

const { toast } = useToast()
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const employeeToDelete = ref(null)
const searchQuery = ref('')
const selectedRole = ref('all')

const form = useForm({
  fullName: '',
  email: '',
  roleId: '',
})

const editForm = useForm({
  id: '',
  fullName: '',
  email: '',
  roleId: '',
})

const { errors } = usePage().props

if (errors) {
  for (const [key, value] of Object.entries(errors)) {
    toast({
      title: 'Error',
      description: value[0],
      variant: 'destructive',
    });
  }
}

const filteredEmployees = computed(() => {
  let filtered = [...props.employees]
  
  // Filtrar por búsqueda
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(emp => 
      emp.fullName.toLowerCase().includes(query) ||
      emp.email.toLowerCase().includes(query) ||
      (emp.role?.rol && emp.role.rol.toLowerCase().includes(query))
    )
  }
  
  // Filtrar por rol
  if (selectedRole.value !== 'all') {
    filtered = filtered.filter(emp => emp.role?.rol === selectedRole.value)
  }
  
  return filtered
})

const availableRoles = computed(() => {
  const roles = ['all', ...new Set(props.employees.map(emp => emp.role?.rol).filter(Boolean))]
  return roles
})

const createEmployee = () => {
  form.post('/settings/employees', {
    onSuccess: () => {
      showCreateModal.value = false
      form.reset()
      toast({
        title: 'Éxito',
        description: 'El empleado ha sido creado correctamente',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

const confirmDelete = (employee) => {
  employeeToDelete.value = employee
  showDeleteConfirm.value = true
}

const deleteEmployee = () => {
  if (!employeeToDelete.value) return
  
  router.delete(`/settings/employees/${employeeToDelete.value.id}`, {
    onSuccess: () => {
      showDeleteConfirm.value = false
      employeeToDelete.value = null
      toast({
        title: 'Empleado eliminado',
        description: 'El empleado ha sido eliminado correctamente',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    }
  })
}

const editEmployee = (employee) => {
  editForm.id = employee.id
  editForm.fullName = employee.fullName
  editForm.email = employee.email
  editForm.roleId = employee.role.id
  showEditModal.value = true
}

const updateEmployee = () => {
  editForm.put(`/settings/employees/${editForm.id}`, {
    onSuccess: () => {
      showEditModal.value = false
      editForm.reset()
      toast({
        title: 'Empleado actualizado',
        description: 'El empleado ha sido actualizado exitosamente.',
        variant: 'outline',
      })
    },
    onError: (error) => {
      showEditModal.value = false
      editForm.reset()
      console.log(usePage().props)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })
}

const getRoleBadgeClass = (roleName) => {
  if (!roleName) return 'bg-gray-100 text-gray-800'
  
  switch(roleName.toLowerCase()) {
    case 'admin':
      return 'bg-blue-100 text-blue-800'
    case 'manager':
      return 'bg-purple-100 text-purple-800'
    case 'editor':
      return 'bg-green-100 text-green-800'
    case 'user':
      return 'bg-amber-100 text-amber-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
</script>

<template>
  <div class="container space-y-6 p-8 pt-6">
    <!-- Encabezado con título y botón de nuevo empleado -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <Users class="h-6 w-6 text-blue-800" />
        <h2 class="text-2xl font-bold tracking-tight">Empleados</h2>
        <span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm text-blue-800">
          {{ filteredEmployees.length }} {{ filteredEmployees.length === 1 ? 'empleado' : 'empleados' }}
        </span>
      </div>
      <Button @click="showCreateModal = true" class="bg-blue-700 hover:bg-blue-800">
        <UserPlus class="w-4 h-4 mr-2" />
        Nuevo Empleado
      </Button>
    </div>

    <!-- Tarjeta con filtros y tabla -->
    <Card class="min-h-[76vh] overflow-hidden shadow-md border-0">
      <CardHeader class="bg-gray-50 border-b px-6 py-4">
        <div class="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <!-- Barra de búsqueda -->
          <div class="relative w-full sm:w-64">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input v-model="searchQuery" class="pl-9 bg-white" placeholder="Buscar empleados..." />
          </div>

          <!-- Filtro de roles -->
          <div class="flex space-x-2 items-center">
            <Filter class="h-4 w-4 text-gray-500" />
            <select v-model="selectedRole" class="h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Todos los roles</option>
              <option v-for="role in props.roles" :key="role.id" :value="role.rol">
                {{ role.rol }}
              </option>
            </select>
          </div>
        </div>
      </CardHeader>

      <CardContent class="p-0">
        <!-- Tabla de empleados -->
        <div class="overflow-x-auto">
          <Table class="w-full">
            <TableHeader>
              <TableRow class="bg-gray-50 hover:bg-gray-50">
                <TableHead class="font-semibold">Nombre</TableHead>
                <TableHead class="font-semibold">Email</TableHead>
                <TableHead class="font-semibold">Rol</TableHead>
                <TableHead class="w-[100px] text-right font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="filteredEmployees.length === 0">
                <TableCell colspan="4" class="h-40 text-center text-gray-500">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <AlertCircle class="h-8 w-8 text-gray-400" />
                    <p>No se encontraron empleados con los filtros actuales</p>
                    <Button variant="outline" size="sm" @click="searchQuery = ''; selectedRole = 'all'" class="mt-2">
                      Limpiar filtros
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              <TableRow v-for="employee in filteredEmployees" :key="employee.id" class="border-b transition-colors hover:bg-blue-50/30">
                <TableCell>
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                      <User class="h-5 w-5" />
                    </div>
                    <div>
                      <p class="font-medium">{{ employee.fullName }}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div class="flex items-center gap-1">
                    <Mail class="h-4 w-4 text-gray-500" />
                    <span>{{ employee.email }}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge :class="getRoleBadgeClass(employee.role?.rol)" class="px-2.5 py-0.5 font-medium">
                    {{ employee.role?.rol || 'Sin rol' }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600" @click="confirmDelete(employee)" title="Eliminar empleado">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600" @click="editEmployee(employee)" title="Editar empleado">
                      <Pencil class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

    <!-- Modal Crear Empleado -->
    <Dialog :open="showCreateModal" @update:open="showCreateModal = false">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-blue-100 p-2">
              <UserPlus class="h-5 w-5 text-blue-600" />
            </div>
            <DialogTitle>Crear Nuevo Empleado</DialogTitle>
          </div>
          <DialogDescription>
            Agrega un nuevo empleado al sistema. Se enviará un email con las credenciales temporales.
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="createEmployee" class="space-y-4">
          <div class="space-y-4">
            <div class="space-y-2">
              <Label class="font-medium">Nombre</Label>
              <Input v-model="form.fullName" required placeholder="Nombre completo" class="border-gray-300 focus:border-blue-500" />
            </div>

            <div class="space-y-2">
              <Label class="font-medium">Email</Label>
              <Input v-model="form.email" type="email" required placeholder="correo@ejemplo.com" class="border-gray-300 focus:border-blue-500" />
            </div>

            <div class="space-y-2">
              <Label class="font-medium">Rol</Label>
              <Select v-model="form.roleId" required>
                <SelectTrigger class="w-full border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="role in roles" :key="role.id" :value="role.id">
                    {{ role.rol }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter class="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" @click="showCreateModal = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="form.processing" class="bg-blue-600 hover:bg-blue-700">
              Crear Empleado
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal Editar Empleado -->
    <Dialog :open="showEditModal" @update:open="showEditModal = false">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-blue-100 p-2">
              <Pencil class="h-5 w-5 text-blue-600" />
            </div>
            <DialogTitle>Editar Empleado</DialogTitle>
          </div>
          <DialogDescription>
            Modifica los datos del empleado
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="updateEmployee" class="space-y-4">
          <div class="space-y-4">
            <div class="space-y-2">
              <Label class="font-medium">Nombre</Label>
              <Input v-model="editForm.fullName" required placeholder="Nombre completo" class="border-gray-300 focus:border-blue-500" />
            </div>

            <div class="space-y-2">
              <Label class="font-medium">Email</Label>
              <Input v-model="editForm.email" type="email" required placeholder="correo@ejemplo.com" class="border-gray-300 focus:border-blue-500" />
            </div>

            <div class="space-y-2">
              <Label class="font-medium">Rol</Label>
              <Select v-model="editForm.roleId" required>
                <SelectTrigger class="w-full border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="role in roles" :key="role.id" :value="role.id" :disabled="role.rol === 'admin'">
                    {{ role.rol }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter class="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" @click="showEditModal = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="editForm.processing" class="bg-blue-600 hover:bg-blue-700">
              Actualizar Empleado
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Modal Confirmación de Eliminación -->
    <Dialog :open="showDeleteConfirm" @update:open="showDeleteConfirm = false">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-red-100 p-2">
              <AlertCircle class="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle>Confirmar eliminación</DialogTitle>
          </div>
          <DialogDescription>
            Esta acción no se puede deshacer. ¿Estás seguro de eliminar a este empleado?
          </DialogDescription>
        </DialogHeader>
        <div v-if="employeeToDelete" class="my-4 rounded-lg bg-gray-50 p-4">
          <div class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <User class="h-5 w-5" />
            </div>
            <div>
              <p class="font-medium">{{ employeeToDelete.fullName }}</p>
              <p class="text-sm text-gray-500">{{ employeeToDelete.email }}</p>
            </div>
          </div>
        </div>
        <DialogFooter class="flex justify-end gap-2">
          <Button type="button" variant="outline" @click="showDeleteConfirm = false">
            Cancelar
          </Button>
          <Button @click="deleteEmployee" variant="destructive" class="bg-red-600 hover:bg-red-700">
            Eliminar empleado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
