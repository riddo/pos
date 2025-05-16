<script setup>
import {
  File,
  ListFilter,
  MoreHorizontal,
  PlusCircle,
  Package,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  MinusCircle,
  Filter,
} from 'lucide-vue-next'
import DashboardLayout from '~/pages/layouts/DashboardLayout.vue'
import { Head, Link } from '@inertiajs/vue3'
import { usePage, router } from '@inertiajs/vue3'
import { useToast } from '~/components/ui/toast/use-toast'
import { ref, computed, watch, onMounted } from 'vue'
import { useDebounce } from '@vueuse/core'

const page = usePage()
const products = computed(() => page.props.products.data)
const meta = computed(() => page.props.products.meta)
const warehouses = computed(() => page.props.warehouses || [])
const { toast } = useToast()

// Estado para el modal de ajuste de inventario
const showAdjustModal = ref(false)
const selectedProduct = ref(null)
const adjustQuantity = ref(0)
const adjustReason = ref('')
const selectedWarehouse = ref('')
const selectedSupplier = ref(null)
const adjustmentReason = ref('')
const transferStatus = ref('pending')

// Obtener suppliers del backend
const suppliers = computed(() => page.props.suppliers || [])

// Constante para las razones de ajuste
const adjustmentReasons = [
  { 
    value: 'stock_received', 
    label: 'Stock Recibido', 
    type: 'add',
    model: 'restock',
    requiresSupplier: true 
  },
  { 
    value: 'transfer', 
    label: 'Transferir', 
    type: 'transfer',
    model: 'transfer',
    requiresDestination: true 
  },
  { 
    value: 'damage', 
    label: 'Daño', 
    type: 'subtract',
    model: 'adjustment',
    requiresReason: true 
  },
  { 
    value: 'theft', 
    label: 'Robo', 
    type: 'subtract',
    model: 'adjustment',
    requiresReason: true 
  },
  { 
    value: 'shrinkage', 
    label: 'Merma', 
    type: 'subtract',
    model: 'adjustment',
    requiresReason: true 
  },
  { 
    value: 'loss', 
    label: 'Pérdida', 
    type: 'subtract',
    model: 'adjustment',
    requiresReason: true 
  },
  { 
    value: 'correction', 
    label: 'Corrección', 
    type: 'both',
    model: 'adjustment',
    requiresReason: true 
  }
]

// Función para abrir el modal de ajuste
const openAdjustModal = (product) => {
  selectedProduct.value = product
  selectedWarehouse.value = product.inventory?.warehouseId
  showAdjustModal.value = true
  adjustReason.value = ''
  adjustQuantity.value = 0
  selectedSupplier.value = null
  adjustmentReason.value = ''
  transferStatus.value = 'pending'
}

// Función para manejar el ajuste de inventario
const handleAdjust = () => {
  if (!selectedProduct.value || !adjustQuantity.value || !adjustReason.value) return

  const reason = adjustmentReasons.find(r => r.value === adjustReason.value)
  if (!reason) return

  // Manejar diferentes tipos de ajustes
  if (reason.value === 'stock_received') {
    if (!selectedProduct.value?.id || !adjustQuantity.value) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Faltan datos requeridos',
        duration: 3000,
      })
      return
    }

    const data = {
      productId: selectedProduct.value.id,
      quantity: parseInt(adjustQuantity.value),
      warehouseId: selectedProduct.value.inventory?.warehouseId,
    }

    // Validar que warehouseId existe
    if (!data.warehouseId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo determinar el almacén',
        duration: 3000,
      })
      return
    }

    if (selectedSupplier.value) {
      data.supplierId = selectedSupplier.value
    }

    router.post('/inventory/restock', data, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        showAdjustModal.value = false
        router.reload()
      },
      onError: (errors) => {
        console.error('Error en restock:', errors)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errors.message || 'No se pudo actualizar el stock',
          duration: 3000,
        })
      }
    })
  } else if (['damage', 'theft', 'shrinkage', 'loss', 'correction'].includes(reason.value)) {
    if (!selectedProduct.value?.id || !adjustQuantity.value) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Faltan datos requeridos',
        duration: 3000,
      })
      return
    }

    const data = {
      productId: selectedProduct.value.id,
      quantity: parseInt(adjustQuantity.value),
      warehouseId: selectedProduct.value.inventory?.warehouseId,
      adjustmentType: reason.value,
      reason: adjustmentReason.value
    }

    // Validar que warehouseId existe
    if (!data.warehouseId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo determinar el almacén',
        duration: 3000,
      })
      return
    }

    // Validar razón si es requerida
    if (reason.requiresReason && !adjustmentReason.value) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'La razón del ajuste es requerida',
        duration: 3000,
      })
      return
    }

    router.post('/inventory/adjustment', data, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        showAdjustModal.value = false
        router.reload()
      },
      onError: (errors) => {
        console.error('Error en ajuste:', errors)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errors.message || 'No se pudo realizar el ajuste',
          duration: 3000,
        })
      }
    })
  } else if (reason.value === 'transfer') {
    if (!selectedProduct.value?.id || !adjustQuantity.value || !selectedWarehouse.value) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Faltan datos requeridos',
        duration: 3000,
      })
      return
    }

    const data = {
      productId: selectedProduct.value.id,
      quantity: parseInt(adjustQuantity.value),
      fromWarehouseId: selectedProduct.value.inventory?.warehouseId,
      toWarehouseId: selectedWarehouse.value
    }

    router.post('/inventory/transfer', data, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        showAdjustModal.value = false
        router.reload()
      },
      onError: (errors) => {
        console.error('Error en transferencia:', errors)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errors.message || 'No se pudo realizar la transferencia',
          duration: 3000,
        })
      }
    })
  }
}

// Función para resetear el modal
const resetModal = () => {
  showAdjustModal.value = false
  selectedProduct.value = null
  adjustQuantity.value = 0
  adjustReason.value = ''
  selectedSupplier.value = null
  selectedWarehouse.value = ''
  adjustmentReason.value = ''
  transferStatus.value = 'pending'
}

// Computed para mostrar/ocultar el selector de tipo de ajuste
const showAdjustTypeSelect = computed(() => {
  const reason = adjustmentReasons.find(r => r.value === adjustReason.value)
  return reason?.type === 'both'
})

// Computed para mostrar/ocultar el selector de almacén destino
const showDestinationWarehouse = computed(() => {
  return adjustReason.value === 'transfer'
})

// Función para traducir y obtener el estilo del status
const getStockStatus = (status) => {
  const statusMap = {
    available: {
      label: 'Disponible',
      variant: 'success',
    },
    low: {
      label: 'Stock Bajo',
      variant: 'warning',
    },
    out_of_stock: {
      label: 'Sin Stock',
      variant: 'destructive',
    },
  }
  return statusMap[status] || { label: 'Desconocido', variant: 'secondary' }
}

// Añadir estado para búsqueda y filtro de almacén
const searchQuery = ref('')
const debouncedSearch = useDebounce(searchQuery, 300)

// Observar cambios en la búsqueda debounced
watch(debouncedSearch, (newQuery) => {
  const params = { page: 1 }
  if (newQuery.trim()) {
    params.search = newQuery
  }
  if (selectedWarehouse.value) {
    params.warehouse = selectedWarehouse.value
  }

  router.get('/inventory', params, {
    preserveState: true,
    preserveScroll: true,
  })
})

// Observar cambios en el almacén seleccionado
watch(selectedWarehouse, (newWarehouseId) => {
  const params = { page: 1 }
  if (searchQuery.value.trim()) {
    params.search = searchQuery.value
  }
  if (newWarehouseId) {
    params.warehouse = newWarehouseId
  }

  router.get('/inventory', params, {
    preserveState: true,
    preserveScroll: true,
  })
})

// Inicializar valores desde la URL
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const searchParam = urlParams.get('search')
  const warehouseParam = urlParams.get('warehouse')
  
  if (searchParam) {
    searchQuery.value = searchParam
  }
  if (warehouseParam) {
    selectedWarehouse.value = parseInt(warehouseParam)
  }
})

// Función para cambiar de página
const changePage = (newPage) => {
  if (newPage < 1 || newPage > meta.value.lastPage) return

  const params = { page: newPage }
  if (searchQuery.value.trim()) {
    params.search = searchQuery.value
  }

  router.get('/inventory', params, {
    preserveState: true,
    preserveScroll: true,
  })
}

// Páginas visibles para la paginación
const visiblePages = computed(() => {
  const current = meta.value.currentPage
  const last = meta.value.lastPage

  if (last <= 3) {
    return Array.from({ length: last }, (_, i) => i + 1)
  }

  if (current >= last - 1) {
    return [last - 2, last - 1, last]
  }

  if (current <= 2) {
    return [1, 2, 3]
  }

  return [current - 1, current, current + 1]
})

// Computed para mostrar campos adicionales según el tipo de ajuste
const showSupplierSelect = computed(() => {
  const reason = adjustmentReasons.find(r => r.value === adjustReason.value)
  return reason?.requiresSupplier
})

const showReasonInput = computed(() => {
  const reason = adjustmentReasons.find(r => r.value === adjustReason.value)
  return reason?.requiresReason
})

// Añadir este computed para validar el formulario
const isFormValid = computed(() => {
  if (!selectedProduct.value || !adjustQuantity.value || !adjustReason.value) return false
  
  const reason = adjustmentReasons.find(r => r.value === adjustReason.value)
  if (!reason) return false

  if (reason.value === 'stock_received') {
    return true
  }

  if (reason.value === 'transfer') {
    return !!selectedWarehouse.value
  }

  if (['damage', 'theft', 'shrinkage', 'loss', 'correction'].includes(reason.value)) {
    return !reason.requiresReason || !!adjustmentReason.value
  }

  return false
})

// Modificar los computed para manejar undefined
const flashSuccess = computed(() => page.props.flash?.success)
const flashError = computed(() => page.props.flash?.error)

// Modificar los watch para verificar que el mensaje existe
watch(flashSuccess, (message) => {
  if (message) {
    toast({
      title: 'Éxito',
      description: message,
      duration: 3000,
    })
  }
})

watch(flashError, (message) => {
  if (message) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: message,
      duration: 3000,
    })
  }
})
</script>

<template>

  <Head title="Inventario" />
  <div class="container space-y-2 p-2">
    <!-- Encabezado con título y contador -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <Package class="h-6 w-6 text-blue-800" />
        <h2 class="text-2xl font-bold tracking-tight">Inventario</h2>
        <span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm text-blue-800">
          {{ products.length }} {{ products.length === 1 ? 'producto' : 'productos' }}
        </span>
      </div>
      <Button variant="outline" @click="router.get('/inventory/list')" class="bg-blue-700 hover:bg-blue-800 text-white">
        Ver Movimientos
        <ListFilter class="ml-2 h-4 w-4" />
      </Button>
    </div>

    <!-- Tarjeta con filtros y tabla -->
    <Card class="min-h-[76vh] overflow-hidden shadow-md border-0 flex flex-col">
      <CardHeader class="bg-gray-50 border-b px-6 py-4">
        <div class="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
          <!-- Barra de búsqueda -->
          <div class="relative w-full sm:w-64">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input v-model="searchQuery" class="pl-9 bg-white" placeholder="Buscar productos..." />
          </div>

          <!-- Filtros -->
          <div class="flex space-x-2 items-center">
            <Filter class="h-4 w-4 text-gray-500" />
            <Select v-model="selectedWarehouse" class="w-[200px]">
              <SelectTrigger class="h-10 border-gray-200 bg-white">
                <SelectValue placeholder="Seleccionar almacén" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Almacenes</SelectLabel>
                  <SelectItem v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                    {{ warehouse.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent class="p-0 flex-1 flex flex-col">
        <div class="overflow-x-auto flex-1">
          <Table class="h-full">
            <TableHeader class="bg-gray-50 hover:bg-gray-50">
              <TableRow>
                <TableHead class="hidden w-[100px] sm:table-cell">
                  <span class="sr-only">img</span>
                </TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Almacén</TableHead>
                <TableHead>Stock Actual</TableHead>
                <TableHead>Stock Crítico</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  <span class="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="products.length === 0">
                <TableCell colspan="7" class="h-40 text-center text-gray-500">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <Package class="h-8 w-8 text-gray-400" />
                    <p>No se encontraron productos con los filtros actuales</p>
                    <Button variant="outline" size="sm" @click="searchQuery = ''; selectedWarehouse = ''" class="mt-2">
                      Limpiar filtros
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              <TableRow v-for="product in products" :key="product.id" class="border-b transition-colors hover:bg-blue-50/30">
                <TableCell class="hidden sm:table-cell">
                  <img :alt="product.productName" class="aspect-square rounded-md object-cover" height="64" :src="`/inertia/public/products/${product.imagePath}`" width="64" />
                </TableCell>
                <TableCell class="font-medium">{{ product.productName }}</TableCell>
                <TableCell>{{ product.inventory?.warehouse?.name }}</TableCell>
                <TableCell>{{ product.inventory?.stock }}</TableCell>
                <TableCell>{{ product.inventory?.criticalStock }}</TableCell>
                <TableCell>
                  <Badge :class="{
                    'bg-blue-100 text-blue-800': product.inventory?.stockStatus === 'available',
                    'bg-amber-100 text-amber-800': product.inventory?.stockStatus === 'low',
                    'bg-rose-100 text-rose-800': product.inventory?.stockStatus === 'out_of_stock'
                  }">
                    {{ getStockStatus(product.inventory?.stockStatus).label }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" @click="openAdjustModal(product)">
                    <PlusCircle class="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <CardFooter class="flex items-center justify-between px-6 py-4 bg-gray-50 border-t mt-auto">
        <!-- ... código de paginación igual que products ... -->
      </CardFooter>
    </Card>
  </div>

  <!-- Modal de ajuste de inventario -->
  <Dialog :open="showAdjustModal" @update:open="showAdjustModal = false">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Ajustar Inventario</DialogTitle>
        <DialogDescription>
          Ajusta el stock del producto "{{ selectedProduct?.productName }}"
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-4">
        <!-- Selector de razón de ajuste -->
        <div class="grid gap-2">
          <Label>Tipo de operación</Label>
          <Select v-model="adjustReason">
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar operación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="reason in adjustmentReasons" :key="reason.value" :value="reason.value">
                {{ reason.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Selector de proveedor (solo para restock) -->
        <div v-if="showSupplierSelect" class="grid gap-2">
          <Label>Proveedor</Label>
          <Select v-model="selectedSupplier">
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                {{ supplier.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Input de razón (para ajustes que requieren razón) -->
        <div v-if="showReasonInput" class="grid gap-2">
          <Label>Razón del ajuste</Label>
          <Input v-model="adjustmentReason" placeholder="Ingrese la razón del ajuste" />
        </div>

        <!-- Selector de almacén destino (solo para transferencias) -->
        <div v-if="adjustReason === 'transfer'" class="grid gap-2">
          <Label>Almacén destino</Label>
          <Select v-model="selectedWarehouse">
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar almacén destino" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id" :disabled="warehouse.id === selectedProduct?.inventory?.warehouseId">
                {{ warehouse.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Input de cantidad -->
        <div class="grid gap-2">
          <Label>Cantidad</Label>
          <Input type="number" v-model="adjustQuantity" placeholder="Cantidad" />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="resetModal">Cancelar</Button>
        <Button @click="handleAdjust" :disabled="!isFormValid">
          Confirmar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style>
/* ... (mismos estilos que en Products.vue) ... */
</style>
