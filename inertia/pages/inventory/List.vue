<script setup>
import { Head, router } from '@inertiajs/vue3'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShoppingBag,
} from 'lucide-vue-next'
import { ref, computed, watch, onMounted } from 'vue'
import { useDebounce } from '@vueuse/core'

const props = defineProps({
  movements: {
    type: Object,
    required: true,
  },
})

const searchQuery = ref('')
const selectedWarehouse = ref('')
const debouncedSearch = useDebounce(searchQuery, 300)

// Observar cambios en la búsqueda y almacén
watch([debouncedSearch, selectedWarehouse], ([newQuery, newWarehouse]) => {
  const params = { page: 1 }
  if (newQuery?.trim()) params.search = newQuery
  if (newWarehouse) params.warehouse = newWarehouse

  router.get('/inventory/list', params, {
    preserveState: true,
    preserveScroll: true,
  })
})

const getMovementTypeName = (type) => {
  const types = {
    restock: 'Reposición',
    sale: 'Venta',
    adjustment: 'Ajuste',
    transfer_in: 'Transferencia Entrada',
    transfer_out: 'Transferencia Salida'
  }
  return types[type] || type
}

const formatDate = (dateString) => {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString))
}

// ... (código de paginación similar a otros componentes)
</script>

<template>
  <Head title="Movimientos de Inventario" />
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="relative w-72">
              <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                v-model="searchQuery"
                class="pl-8"
                placeholder="Buscar por producto..."
                type="search"
              />
            </div>
            <Select v-model="selectedWarehouse">
              <SelectTrigger class="w-[200px]">
                <SelectValue placeholder="Seleccionar almacén" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Almacenes</SelectLabel>
                  <SelectItem 
                    v-for="warehouse in movements.warehouses" 
                    :key="warehouse.id" 
                    :value="warehouse.id"
                  >
                    {{ warehouse.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader class="flex flex-row items-center space-y-0 gap-3">
            <div class="rounded-full bg-blue-100 p-2 flex-shrink-0">
              <ShoppingBag class="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Movimientos de Inventario</CardTitle>
              <CardDescription>
                Historial de todos los movimientos de inventario
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div v-if="movements.data.length" class="relative w-full overflow-auto h-[62vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Almacén</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Razón</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="movement in movements.data" :key="movement.id" class="border-b hover:bg-blue-50/30">
                    <TableCell>{{ formatDate(movement.createdAt) }}</TableCell>
                    <TableCell>
                      <Badge 
                        :class="{
                          'bg-red-100 text-red-800': movement.movementType === 'sale',
                          'bg-green-100 text-green-800': movement.movementType === 'restock',
                          'bg-blue-100 text-blue-800': movement.movementType === 'transfer_in',
                          'bg-amber-100 text-amber-800': movement.movementType === 'transfer_out',
                          'bg-purple-100 text-purple-800': movement.movementType === 'adjustment',
                        }"
                      >
                        {{ getMovementTypeName(movement.movementType) }}
                      </Badge>
                    </TableCell>
                    <TableCell class="font-medium">{{ movement.product?.productName || 'N/A' }}</TableCell>
                    <TableCell>{{ movement.warehouse?.name || 'N/A' }}</TableCell>
                    <TableCell>{{ movement.quantity }}</TableCell>
                    <TableCell>{{ movement.user?.name || 'Sistema' }}</TableCell>
                    <TableCell>{{ movement.reason || '-' }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <div v-else class="flex flex-col items-center justify-center py-20">
              <div class="text-center">
                <div class="mb-6">
                  <div class="mx-auto h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-500">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                      <path d="M3 6h18"></path>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>
                  </div>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-1">
                  Aún no se registran movimientos
                </h3>
                <p class="text-gray-500 mb-6">
                  Las movimientos de inventario aparecerán aquí una vez que se procesen en el punto de venta.
                </p>
                <Button variant="outline" size="sm" @click="searchQuery = ''; selectedWarehouse = ''">
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </CardContent>
          <!-- ... (código de paginación) ... -->
        </Card>
      </div>
</template>

<style scoped>
/* Añadir estilos específicos para los estados de movimientos */
:deep(.badge-success) {
  background-color: #d1fae5;
  color: #065f46;
}

:deep(.badge-warning) {
  background-color: #fef3c7;
  color: #92400e;
}

:deep(.badge-destructive) {
  background-color: #fee2e2;
  color: #b91c1c;
}

:deep(.badge-info) {
  background-color: #dbeafe;
  color: #1e40af;
}
</style>
