<script setup>
import { ref, computed, onMounted } from 'vue'
import { router, useForm, usePage } from '@inertiajs/vue3'
import { Plus, Pencil, Trash2, Check, X, CheckCheck, Shield } from 'lucide-vue-next'
import SettingsLayout from '~/pages/layouts/SettingsLayout.vue'
import { useToast } from '~/components/ui/toast/use-toast'

const props = defineProps({
  roles: {
    type: Array,
    required: true,
  },
  permissions: {
    type: Array,
    required: true,
  },
  success: String,
})

const form = useForm({
  rol: '',
  permissions: [],
})

const editForm = useForm({
  id: null,
  rol: '',
  permissions: [],
})

const { toast } = useToast()
const showCreateModal = ref(false)
const showEditModal = ref(false)

const openEditModal = (role) => {
  editForm.id = role.id
  editForm.rol = role.rol
  editForm.permissions = role.permissions.map(p => p.id)
  showEditModal.value = true
}

const updateRole = () => {
  editForm.put(`/settings/roles/${editForm.id}`, {
    onSuccess: () => {
      showEditModal.value = false
      editForm.reset()
      toast({
        title: 'Rol actualizado',
        description: 'El rol ha sido actualizado exitosamente.',
        variant: 'outline',
      })
    },
  })
}

const deleteRole = (roleId) => {
  if (confirm('¿Estás seguro de eliminar este rol?')) {
    router.delete(`/settings/roles/${roleId}`, {
      onSuccess: () => {
        toast({
          title: 'Rol eliminado',
          description: 'El rol ha sido eliminado exitosamente.',
          variant: 'destructive',
        })
      },
      onError: (error) => {
        toast({
            title: 'No se puede eliminar el rol',
            description: error.message,
            variant: 'destructive'
        })
      }
    })
  }
}

onMounted(() => {
  if (props.success) {
    toast({
      title: 'Éxito',
      description: props.success,
      variant: 'outline',
    })
  }
})
</script>

<template>

  <Head title="Gestión de Roles" />
  <div class="container space-y-6 p-8 pt-6">
    <!-- Encabezado con título y botón de nuevo rol -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <Shield class="h-6 w-6 text-blue-800" />
        <h2 class="text-2xl font-bold tracking-tight">Roles</h2>
        <span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm text-blue-800">
          {{ roles.length }} {{ roles.length === 1 ? 'rol' : 'roles' }}
        </span>
      </div>
      <Link href="/settings/roles/create">
      <Button class="bg-blue-700 hover:bg-blue-800">
        <Plus class="w-4 h-4 mr-2" />
        Nuevo Rol
      </Button>
      </Link>
    </div>

    <!-- Tarjeta con tabla -->
    <Card class="min-h-[76vh] overflow-hidden shadow-md border-0">
      <CardHeader class="bg-gray-50 border-b px-6 py-4">
        <div class="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <!-- Título de la sección -->
          <div class="text-lg font-semibold text-gray-800">
            Lista de Roles
          </div>
        </div>
      </CardHeader>

      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow class="bg-gray-50 hover:bg-gray-50">
              <TableHead class="font-semibold">Rol</TableHead>
              <TableHead class="font-semibold">Permisos</TableHead>
              <TableHead class="w-[100px] text-right font-semibold">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="role in roles" :key="role.id" class="border-b transition-colors hover:bg-blue-50/30">
              <TableCell>
                <div class="flex items-center gap-3">
                  <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-800">
                    <Shield class="h-5 w-5" />
                  </div>
                  <div>
                    <p class="font-medium">{{ role.rol }}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex flex-wrap gap-1">
                  <template v-if="role.rol === 'admin'">
                    <Badge variant="secondary" class="bg-blue-100 text-blue-800">
                      Todos los permisos asignados
                    </Badge>
                  </template>
                  <template v-else>
                    <Badge v-for="permission in role.permissions" :key="permission.id" variant="secondary" class="bg-gray-100 text-gray-800">
                      {{ permission.description }}
                    </Badge>
                  </template>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex items-center justify-end gap-2">
                  <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600" @click="deleteRole(role.id)" :disabled="role.rol === 'admin'" title="Eliminar rol">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600" @click="openEditModal(role)" title="Editar rol">
                    <Pencil class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Modal Editar Rol -->
    <Dialog :open="showEditModal" @update:open="showEditModal = false">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <div class="flex items-center gap-3">
            <div class="rounded-full bg-blue-100 p-2">
              <Pencil class="h-5 w-5 text-blue-600" />
            </div>
            <DialogTitle>Editar Rol</DialogTitle>
          </div>
          <DialogDescription>
            Modifica el nombre y los permisos del rol
          </DialogDescription>
        </DialogHeader>
        <form @submit.prevent="updateRole" class="space-y-4">
          <div class="space-y-4">
            <div class="space-y-2">
              <Label class="font-medium">Nombre del Rol</Label>
              <Input v-model="editForm.rol" required :disabled="editForm.rol === 'admin'" class="border-gray-300 focus:border-blue-500" />
            </div>

            <div class="space-y-2">
              <Label class="font-medium">Permisos</Label>
              <Command class="border rounded-md">
                <CommandInput placeholder="Buscar permisos..." />
                <CommandList>
                  <CommandEmpty>No se encontraron permisos.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem v-for="permission in permissions" :key="permission.id" :value="permission.id" @select="() => {
                        const index = editForm.permissions.indexOf(permission.id)
                        if (index === -1) {
                          editForm.permissions.push(permission.id)
                        } else {
                          editForm.permissions.splice(index, 1)
                        }
                      }">
                      <div class="flex items-center gap-2">
                        <CheckCheck class="h-4 w-4" :class="editForm.permissions.includes(permission.id) ? 'opacity-100' : 'opacity-0'" />
                        <span>{{ permission.permissionsName }}</span>
                      </div>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </div>

          <DialogFooter class="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" @click="showEditModal = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="editForm.processing" class="bg-blue-600 hover:bg-blue-700">
              Actualizar Rol
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template> 