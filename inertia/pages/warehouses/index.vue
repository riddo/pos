<script setup>
import { ref, computed, watch } from 'vue'
import { Head, usePage, router } from '@inertiajs/vue3'
import DashboardLayout from '~/pages/layouts/DashboardLayout.vue'
import { Store, Search, Plus, MoreHorizontal } from 'lucide-vue-next'
import { useToast } from '~/components/ui/toast/use-toast'
import { useDebounce } from '@vueuse/core'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  PlusCircle,
  Trash2,
  Pencil,
  AlertCircle,
} from 'lucide-vue-next'

const page = usePage()
const warehouses = computed(() => page.props.warehouses.data)
const meta = computed(() => page.props.warehouses.meta)
const { toast } = useToast()

// Estado para el modal de confirmación
const showDeleteModal = ref(false)
const warehouseToDelete = ref(null)

const searchQuery = ref('')
const debouncedSearch = useDebounce(searchQuery, 300)

// Observar cambios en la búsqueda debounced
watch(debouncedSearch, (newQuery) => {
  const params = { page: 1 }
  if (newQuery.trim()) {
    params.search = newQuery
  }

  router.get('/warehouses', params, {
    preserveState: true,
    preserveScroll: true,
  })
})

// Función para cambiar de página
const changePage = (newPage) => {
  if (newPage < 1 || newPage > meta.value.lastPage) {
    return
  }
  const params = { page: newPage }
  if (searchQuery.value.trim()) {
    params.search = searchQuery.value
  }
  
  // Si vamos a la primera o última página, primero movemos a una página intermedia
  if (
    (newPage === 1 && meta.value.currentPage > 3) ||
    (newPage === meta.value.lastPage && meta.value.currentPage < meta.value.lastPage - 2)
  ) {
    const intermediatePage = newPage === 1 ? 2 : meta.value.lastPage - 1
    router.get(
      '/warehouses',
      { ...params, page: intermediatePage },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          setTimeout(() => {
            router.get('/warehouses', params, {
              preserveState: true,
              preserveScroll: true,
            })
          }, 200)
        },
      }
    )
    return
  }

  router.get('/warehouses', params, {
    preserveState: true,
    preserveScroll: true,
    onSuccess: () => {
      console.log('Página actual:', meta.value.currentPage)
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo cambiar de página.',
        duration: 3000,
      })
    },
  })
}

// Función para calcular las páginas visibles
const visiblePages = computed(() => {
  const current = meta.value.currentPage
  const last = meta.value.lastPage

  if (last <= 3) {
    return Array.from({ length: last }, (_, i) => i + 1)
  }

  if (current >= last - 1) {
    return [last - 2, last - 1, last].filter((page) => page > 0)
  }

  if (current <= 2) {
    return [1, 2, 3].filter((page) => page <= last)
  }

  return [current - 1, current, current + 1]
})

const getWarehouseTypeLabel = (type) => {
  return type === 'store' ? 'Tienda' : 'Bodega'
}

const getStatusBadge = (status) => {
  return {
    active: { label: 'Activo', variant: 'success' },
    inactive: { label: 'Inactivo', variant: 'destructive' },
  }[status]
}

const openDeleteModal = (warehouse) => {
  warehouseToDelete.value = warehouse
  showDeleteModal.value = true
}

const handleDelete = () => {
  if (!warehouseToDelete.value) return

  router.delete(`/warehouses/${warehouseToDelete.value.id}`, {
    onSuccess: () => {
      toast({
        title: 'Almacén eliminado',
        description: `${warehouseToDelete.value.name} ha sido eliminado exitosamente.`,
        duration: 3000,
      })
      showDeleteModal.value = false
      warehouseToDelete.value = null
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el almacén.',
        duration: 3000,
      })
    },
  })
}
</script>

<template>

  <Head title="Almacenes" />
  <div class="container space-y-2 p-2">
    <!-- Encabezado con título y contador -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <Store class="h-6 w-6 text-blue-800" />
        <h2 class="text-2xl font-bold tracking-tight">Almacenes</h2>
        <span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm text-blue-800">
          {{ warehouses.length }} {{ warehouses.length === 1 ? 'almacén' : 'almacenes' }}
        </span>
      </div>
      <Link href="/warehouses/create">
      <Button class="bg-blue-700 hover:bg-blue-800">
        <PlusCircle class="w-4 h-4 mr-2" />
        Nuevo Almacén
      </Button>
      </Link>
    </div>

    <!-- Vista para cuando no hay almacenes registrados -->
    <div v-if="warehouses.length === 0 && !searchQuery.trim()" class="flex flex-col items-center justify-center my-20 px-4 min-h-[75vh]">
      <div class="bg-gray-50 rounded-full p-2 mb-2">
        <Store class="h-16 w-16 text-blue-400" />
      </div>
      <h2 class="text-2xl font-semibold text-gray-800 mb-3">No hay almacenes registrados</h2>
      <p class="text-gray-500 max-w-lg mb-8 text-center">Necesitas crear al menos un almacén para poder gestionar productos e inventario.</p>
      <Link href="/warehouses/create">
      <Button class="bg-blue-700 hover:bg-blue-800">
        <PlusCircle class="w-4 h-4 mr-2" />
        Crear almacén
      </Button>
      </Link>
    </div>

    <!-- Sin resultados para búsqueda específica -->
    <div v-else-if="warehouses.length === 0 && searchQuery.trim()" class="flex flex-col items-center justify-center my-20 px-4 min-h-[75vh]">
      <div class="bg-gray-50 rounded-full p-2 mb-2">
        <Search class="h-16 w-16 text-blue-400" />
      </div>
      <h2 class="text-2xl font-semibold text-gray-800 mb-3">No se encontraron resultados</h2>
      <p class="text-gray-500 max-w-lg mb-8 text-center">No hay almacenes que coincidan con tu búsqueda "{{ searchQuery }}".</p>
      <Button variant="outline" @click="searchQuery = ''" class="px-6">
        Limpiar búsqueda
      </Button>
    </div>

    <!-- Tarjeta con filtros y tabla (solo se muestra cuando hay almacenes o hay una búsqueda) -->
    <Card v-else class="min-h-[76vh] overflow-hidden shadow-md border-0 flex flex-col">
      <CardHeader class="bg-gray-50 border-b px-6 py-4">
        <div class="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <!-- Barra de búsqueda -->
          <div class="relative w-full sm:w-64">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <input v-model="searchQuery" class="w-full h-10 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Buscar almacenes..." type="search" @input="e => searchQuery = e.target.value" />
          </div>
        </div>
      </CardHeader>

      <CardContent class="p-0 flex-1 flex flex-col">
        <div class="overflow-x-auto flex-1">
          <Table class="h-full">
            <TableHeader class="bg-gray-50 hover:bg-gray-50">
              <TableRow>
                <TableHead class="font-semibold">Nombre</TableHead>
                <TableHead class="font-semibold">Ubicación</TableHead>
                <TableHead class="font-semibold">Tipo</TableHead>
                <TableHead class="font-semibold">Estado</TableHead>
                <TableHead class="w-[100px] text-right font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="warehouse in warehouses" :key="warehouse.id" class="border-b transition-colors hover:bg-blue-50/30">
                <TableCell class="font-medium">{{ warehouse.name }}</TableCell>
                <TableCell>{{ warehouse.location }}</TableCell>
                <TableCell>{{ getWarehouseTypeLabel(warehouse.warehouseType) }}</TableCell>
                <TableCell>
                  <Badge :class="{
                    'bg-blue-100 text-blue-800': warehouse.status === 'active',
                    'bg-rose-100 text-rose-800': warehouse.status === 'inactive'
                  }">
                    {{ getStatusBadge(warehouse.status).label }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div class="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600" @click="router.get(`/warehouses/${warehouse.id}/edit`)" title="Editar almacén">
                      <Pencil class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <CardFooter class="flex items-center justify-between px-6 py-4 bg-gray-50 border-t mt-auto">
        <!-- Paginación -->
        <p class="text-sm text-muted-foreground">
          Mostrando {{ (meta.currentPage - 1) * meta.perPage + 1 }} a
          {{ Math.min(meta.currentPage * meta.perPage, meta.total) }} de
          {{ meta.total }} almacenes
        </p>

        <div class="flex items-center gap-0.5">
          <!-- Primera página y Anterior -->
          <div class="flex gap-0.5">
            <Button variant="outline" :disabled="meta.currentPage === 1" @click="changePage(1)" class="px-2 h-10">
              <ChevronsLeft class="h-4 w-4" />
            </Button>
            <Button variant="outline" :disabled="meta.currentPage === 1" @click="changePage(meta.currentPage - 1)" class="px-2 h-10">
              <ChevronLeft class="h-4 w-4" />
            </Button>
          </div>

          <!-- Números de página -->
          <div class="w-[160px] flex justify-center">
            <div class="relative w-[100px] h-10">
              <div class="flex gap-0 absolute left-0 right-0 justify-center" :style="{
                        transform: 'none',
                    }">
                <template v-for="pageNum in visiblePages" :key="pageNum">
                  <Button :variant="pageNum === meta.currentPage ? 'default' : 'outline'" class="w-10 h-10 transition-all duration-200 ease-in-out" :class="{
                            'translate-x-[10px]': pageNum === visiblePages[2],
                            'translate-x-[-10px]': pageNum === visiblePages[0],
                            'translate-x-0': pageNum === visiblePages[1],
                        }" @click="changePage(pageNum)">
                    {{ pageNum }}
                  </Button>
                </template>
              </div>
            </div>
          </div>

          <!-- Siguiente y Última página -->
          <div class="flex gap-0.5">
            <Button variant="outline" :disabled="meta.currentPage === meta.lastPage" @click="changePage(meta.currentPage + 1)" class="px-2 h-10">
              <ChevronRight class="h-4 w-4" />
            </Button>
            <Button variant="outline" :disabled="meta.currentPage === meta.lastPage" @click="changePage(meta.lastPage)" class="px-2 h-10">
              <ChevronsRight class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  </div>

  <!-- Modal de confirmación de eliminación -->
  <Dialog :open="showDeleteModal" @update:open="showDeleteModal = false">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <div class="flex items-center gap-3">
          <div class="rounded-full bg-red-100 p-2">
            <AlertCircle class="h-5 w-5 text-red-600" />
          </div>
          <DialogTitle>Confirmar eliminación</DialogTitle>
        </div>
        <DialogDescription>
          ¿Estás seguro de que deseas eliminar el almacén "{{ warehouseToDelete?.name }}"?
          Esta acción no se puede deshacer.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter class="flex justify-end gap-2">
        <Button type="button" variant="outline" @click="showDeleteModal = false">
          Cancelar
        </Button>
        <Button @click="handleDelete" variant="destructive" class="bg-red-600 hover:bg-red-700">
          Eliminar almacén
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>