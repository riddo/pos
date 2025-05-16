<script setup>
import { Head, router } from '@inertiajs/vue3'
import {
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Receipt,
  TrendingUp,
  Badge,
  Package,
  Calendar,
  ChevronDown,
} from 'lucide-vue-next'
import { ref, computed, watch, onMounted } from 'vue'
import { useDebounce } from '@vueuse/core'
import { DonutChart } from '~/components/ui/chart-donut'
import { LineChart } from '~/components/ui/chart-line'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from '~/components/ui/select'
import { Input } from '~/components/ui/input'
import CustomSalesChartTooltip from '~/components/ui/chart/CustomSalesChartTooltip.vue'
import { Link } from '@inertiajs/vue3'
import { Button } from '~/components/ui/button'

// Definir props
const props = defineProps({
  sales: {
    type: Object,
    required: true,
  },
})

console.log('sales', props.sales)

const searchQuery = ref('')
const debouncedSearch = useDebounce(searchQuery, 300)
const selectedWarehouse = ref('')
const topProducts = computed(() => props.sales.topProducts || [])
const warehouses = computed(() => props.sales.warehouses || [])

// Valores para los selectores de mes y año
const selectedMonth = ref(props.sales.filters?.month || new Date().getMonth() + 1)
const selectedYear = ref(props.sales.filters?.year || new Date().getFullYear())
const months = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
]
const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)

// Observar cambios en la búsqueda debounced
watch(debouncedSearch, (newQuery) => {
  // Mantener todos los filtros existentes (warehouse, month, year)
  const params = { page: 1 }
  
  if (newQuery.trim()) {
    params.search = newQuery
  }
  
  // Incluir todos los filtros activos
  if (selectedWarehouse.value) {
    params.warehouse = selectedWarehouse.value
  }
  
  // Mantener los filtros de mes/año
  if (selectedMonth.value) {
    params.month = selectedMonth.value
  }
  
  if (selectedYear.value) {
    params.year = selectedYear.value
  }
  
  console.log('Realizando búsqueda de ventas con parámetros:', params);
  
  router.get('/sales', params, {
    preserveState: true,
    preserveScroll: true,
  })
})

// Modificar el watch para el cambio de almacén
watch(selectedWarehouse, (newWarehouseId) => {
  console.log("Warehouse seleccionado:", newWarehouseId, "tipo:", typeof newWarehouseId);
  
  // El manejador ahora está en handleWarehouseChange, 
  // esta función asegura compatibilidad con código existente
})

const meta = computed(() => props.sales.meta)

// Función para cambiar de página
const changePage = (newPage) => {
  if (newPage < 1 || newPage > meta.value.lastPage) {
    return
  }
  const params = { page: newPage }
  if (searchQuery.value.trim()) {
    params.search = searchQuery.value
  }
  router.get('/sales', params, {
    preserveState: true,
    preserveScroll: true,
  })
}

// Función para calcular las páginas visibles
const visiblePages = computed(() => {
  const current = meta.value.currentPage
  const last = meta.value.lastPage

  // Si hay 3 o menos páginas, mostrar todas
  if (last <= 3) {
    return Array.from({ length: last }, (_, i) => i + 1)
  }

  // Si estamos en las últimas 2 páginas
  if (current >= last - 1) {
    return [last - 2, last - 1, last]
  }

  // Si estamos en las primeras 2 páginas
  if (current <= 2) {
    return [1, 2, 3]
  }

  // En cualquier otro caso, mostrar la página actual y una página antes y después
  return [current - 1, current, current + 1]
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Para formato 24 horas
  }
  return new Intl.DateTimeFormat('es-ES', options).format(date).replace(',', '') // Eliminar la coma
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(price)
}

// Modificar initSearch para incluir el warehouse
const initSearch = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const searchParam = urlParams.get('search')
  const warehouseParam = urlParams.get('warehouse')
  
  if (searchParam) {
    searchQuery.value = searchParam
  }
  if (warehouseParam) {
    selectedWarehouse.value = warehouseParam
  } else {
    // Si no hay parámetro de warehouse, mostrar todos los almacenes
    selectedWarehouse.value = ''
  }
}

// Agregar estado de carga
const isInitialLoading = ref(true)

// Modificar la función onMounted para manejar correctamente el caso de "Todos los almacenes"
onMounted(() => {
  initSearch()
  
  // Iniciar sin loading ya que la carga inicial mostrará todos los almacenes
  isInitialLoading.value = false
})
console.log(topProducts.value)

// Observar cambios en mes y año seleccionados
watch([selectedMonth, selectedYear], ([newMonth, newYear]) => {
  router.get('/sales', { 
    month: newMonth, 
    year: newYear,
    page: 1,
    ...(searchQuery.value ? { search: searchQuery.value } : {}),
    ...(selectedWarehouse.value ? { warehouse: selectedWarehouse.value } : {})
  }, {
    preserveState: true,
    preserveScroll: true,
  })
})

// Transformar los datos de ventas diarias para el gráfico
const salesChartData = computed(() => {
  // Obtener el número de días en el mes seleccionado
  const daysInMonth = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
  
  // Nombres de los meses en español
  const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]
  
  // Crear un array con todos los días del mes
  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNumber = i + 1
    
    return {
      day: `${dayNumber}`,
      'Ventas': 0,
      // Agregar metadatos para el tooltip
      dayFormatted: dayNumber,
      monthFormatted: monthNames[selectedMonth.value - 1],
      yearFormatted: selectedYear.value
    }
  })
  
  // Rellenar con datos reales
  if (props.sales.salesByDay) {
    props.sales.salesByDay.forEach(item => {
      const dayIndex = Number(item.day) - 1
      if (dayIndex >= 0 && dayIndex < daysInMonth) {
        chartData[dayIndex]['Ventas'] = Number(item.total || 0)
        // Si hay datos formateados disponibles, usarlos
        if (item.day_formatted) {
          chartData[dayIndex].dayFormatted = item.day_formatted
        }
        if (item.month_formatted) {
          chartData[dayIndex].monthFormatted = monthNames[parseInt(item.month_formatted) - 1]
        }
        if (item.year_formatted) {
          chartData[dayIndex].yearFormatted = item.year_formatted
        }
      }
    })
  }
  
  return chartData
})

// Formateador personalizado para el tooltip
const tooltipFormatter = (category, value, datum) => {
  // Formatear el valor con el símbolo $ y separadores de miles
  const formattedValue = typeof value === 'number'
    ? `$${new Intl.NumberFormat('es').format(value)}`
    : value
    
  return {
    title: datum.day,
    data: {
      day: datum.dayFormatted,
      month: datum.monthFormatted,
      year: datum.yearFormatted,
      name: category,
      color: '#1d4ed8',
      value: formattedValue
    }
  }
}

// Obtener el nombre del mes seleccionado
const selectedMonthName = computed(() => {
  return months.find(m => m.value === selectedMonth.value)?.label || ''
})

// Pasar directamente el componente importado
const customTooltip = CustomSalesChartTooltip

const getPaymentMethodName = (method) => {
  const methods = {
    1: 'Efectivo',
    2: 'Débito',
    3: 'Crédito',
  }
  return methods[method] || method
}

// Selector de almacén personalizado
const handleWarehouseChange = () => {
  const params = { page: 1 }
  if (searchQuery.value.trim()) {
    params.search = searchQuery.value
  }
  // Solo agregamos el parámetro warehouse si hay un ID seleccionado
  // Convertir a número si no está vacío
  if (selectedWarehouse.value) {
    params.warehouse = Number(selectedWarehouse.value)
    console.log('Enviando warehouse al backend:', params.warehouse, 'tipo:', typeof params.warehouse)
  }

  router.get('/sales', params, {
    preserveState: true,
    preserveScroll: true,
  })
}
</script>


<template>

  <Head title="Ventas" />
  <div class="container space-y-4 px-2 py-2">
    <!-- Encabezado con título y contador -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <Receipt class="h-6 w-6 text-blue-800" />
        <h2 class="text-2xl font-bold tracking-tight">Ventas</h2>
        <span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm text-blue-800">
          {{ sales.data.length }} {{ sales.data.length === 1 ? 'venta' : 'ventas' }}
        </span>
        <!-- Depuración - Muestra el ID del almacén actual -->
        <span v-if="selectedWarehouse" class="text-xs text-gray-500 ml-2">(Almacén ID: {{ selectedWarehouse }})</span>
      </div>

      <!-- Selector de almacén personalizado -->
      <div class="flex space-x-2 items-center">
        <Filter class="h-4 w-4 text-gray-500" />
        <div class="relative inline-block w-[200px]">
          <select v-model="selectedWarehouse" @change="handleWarehouseChange" class="block w-full appearance-none rounded-md border border-gray-200 bg-white py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">Todos los almacenes</option>
            <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
              {{ warehouse.name }}
            </option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <ChevronDown class="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>

    <!-- Indicador de carga durante el filtrado inicial -->
    <div v-if="isInitialLoading" class="flex flex-col items-center justify-center py-20">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mb-4"></div>
      <p class="text-gray-600">Cargando ventas del almacén...</p>
    </div>

    <!-- El resto del contenido se muestra solo cuando no está cargando inicialmente -->
    <template v-else>
      <!-- Sin almacenes registrados -->
      <div v-if="!warehouses.length" class="flex flex-col items-center justify-center my-20 px-4 min-h-[75vh]">
        <div class="bg-gray-50 rounded-full p-2 mb-2">
          <Package class="h-16 w-16 text-blue-400" />
        </div>
        <h2 class="text-2xl font-semibold text-gray-800 mb-3">No hay almacenes registrados</h2>
        <p class="text-gray-500 max-w-lg mb-8 text-center">Necesitas crear al menos un almacén tipo tienda para poder registrar ventas.</p>
        <Link href="/warehouses/create">
        <Button class="bg-blue-700 hover:bg-blue-800">
          <span class="mr-2">+</span>
          Crear almacén
        </Button>
        </Link>
      </div>

      <!-- Todos los almacenes sin ventas -->
      <div v-else-if="sales.data.length === 0 && !selectedWarehouse" class="flex flex-col items-center justify-center my-20 px-4 min-h-[75vh]">
        <div class="bg-gray-50 rounded-full p-2 mb-2">
          <Receipt class="h-16 w-16 text-blue-400" />
        </div>
        <h2 class="text-2xl font-semibold text-gray-800 mb-3">Aún no se registran ventas en ninguna tienda</h2>
        <p class="text-gray-500 max-w-lg mb-8 text-center">Las ventas aparecerán aquí una vez que se procesen en el punto de venta.</p>
        <Link href="/pos">
        <Button class="bg-blue-700 hover:bg-blue-800">
          <span class="mr-2">+</span>
          Crear nueva venta
        </Button>
        </Link>
      </div>

      <!-- Almacén específico sin ventas -->
      <div v-else-if="sales.data.length === 0 && selectedWarehouse" class="flex flex-col items-center justify-center my-20 px-4 min-h-[75vh]">
        <div class="bg-gray-50 rounded-full p-2 mb-2">
          <Package class="h-16 w-16 text-blue-400" />
        </div>
        <h2 class="text-2xl font-semibold text-gray-800 mb-3">No hay ventas registradas en este almacén</h2>
        <p class="text-gray-500 max-w-lg mb-8 text-center">Puedes seleccionar otro almacén o crear una nueva venta.</p>
        <div class="flex gap-4">
          <Link href="/sales">
          <Button variant="outline" @click="selectedWarehouse = ''" class="px-6">
            Ver todos los almacenes
          </Button>
          </Link>
          <Link href="/pos">
          <Button class="bg-blue-700 hover:bg-blue-800">
            <span class="mr-2">+</span>
            Crear nueva venta
          </Button>
          </Link>
        </div>
      </div>

      <!-- Mostrar gráficos y tabla solo cuando hay ventas -->
      <template v-else>
        <div class="flex flex-col md:flex-row gap-4 mb-4 h-[270px]">
          <Card class="w-2/5 pt-2 pb-10">
            <CardHeader class="px-4 py-2 flex flex-row justify-between items-center">
              <CardTitle class="text-sm flex items-center gap-2">
                <TrendingUp class="h-4 w-4 text-blue-800" />
                Ventas diarias: {{ selectedMonthName }} {{ selectedYear }}
              </CardTitle>
              <div class="flex gap-2">
                <Select v-model="selectedMonth" class="w-32">
                  <SelectTrigger class="h-8">
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="month in months" :key="month.value" :value="month.value">
                      {{ month.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select v-model="selectedYear" class="w-24">
                  <SelectTrigger class="h-8">
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="year in years" :key="year" :value="year">
                      {{ year }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent class="p-0 h-[150px]">
              <LineChart :data="salesChartData" index="day" :categories="['Ventas']" class="w-full h-full" :colors="['#5c41f6']" :y-formatter="(tick) => {
                  return typeof tick === 'number'
                      ? `$${new Intl.NumberFormat('es').format(tick)}`
                      : ''
                }" :custom-tooltip="CustomSalesChartTooltip" />
            </CardContent>
          </Card>
          <Card class=" w-3/5">
            <CardHeader class="bg-gray-50 text-slate-800 px-4 py-3">
              <CardTitle class="text-base flex items-center gap-2 justify-center">
                <TrendingUp class="h-4 w-4 text-blue-800" />
                Top 3 productos más vendidos
              </CardTitle>
            </CardHeader>
            <CardContent class="grid grid-cols-5">
              <div class="flex items-center justify-center col-span-2">
                <DonutChart index="name" category="totalSold" :data="topProducts" type="pie" :colors="['#9371f9', '#c9a2fc', '#5c41f6', '#00c795', '#ffffff', '#cccccc', '#999999', '#666666']" />
              </div>
              <div class="flex items-center justify-center col-span-3">
                <Table class="col-span-2">
                  <TableHeader>
                    <TableRow>
                      <TableHead class="w-1/5 text-center">#</TableHead>
                      <TableHead class="w-2/5 text-center">Producto</TableHead>
                      <TableHead class="w-2/5 text-center">Total vendido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow v-for="(product, index) in topProducts.slice(0, 5)" :key="index">
                      <TableCell class="text-center">
                        <div class="flex items-center justify-center mx-auto w-6 h-6 rounded-full bg-gray-100 text-slate-800 text-xs font-bold">
                          {{ index + 1 }}
                        </div>
                      </TableCell>
                      <TableCell class="text-center">
                        <span class="font-medium truncate max-w-[120px] mx-auto">{{ product.product.productName }}</span>
                      </TableCell>
                      <TableCell class="text-center">
                        <span class="inline-flex justify-center items-center text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full mx-auto">
                          {{ product.totalSold }}
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Tarjeta con filtros y tabla -->
        <Card class="min-h-[76vh] overflow-hidden shadow-md border-0 flex flex-col">
          <CardHeader class="bg-gray-50 border-b px-6 py-4">
            <div class="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
              <!-- Barra de búsqueda -->
              <div class="relative w-full sm:w-64">
                <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <input v-model="searchQuery" class="w-full h-10 pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Buscar ventas..." type="search" @input="e => searchQuery = e.target.value" />
              </div>
            </div>
          </CardHeader>

          <CardContent class="p-0 flex-1 flex flex-col">
            <div class="overflow-x-auto flex-1">
              <Table class="h-full">
                <TableHeader class="bg-gray-50 hover:bg-gray-50">
                  <TableRow>
                    <TableHead class="font-semibold">ID</TableHead>
                    <TableHead class="font-semibold">Fecha</TableHead>
                    <TableHead class="font-semibold">Cliente</TableHead>
                    <TableHead class="font-semibold">Método de Pago</TableHead>
                    <TableHead class="font-semibold">Total</TableHead>
                    <TableHead class="w-[100px] text-right font-semibold">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-if="sales.data.length === 0">
                    <TableCell colspan="6" class="h-40 text-center text-gray-500">
                      <div class="flex flex-col items-center justify-center gap-2">
                        <Receipt class="h-8 w-8 text-gray-400" />
                        <p>No se encontraron ventas con los filtros actuales</p>
                        <Button variant="outline" size="sm" @click="searchQuery = ''; selectedWarehouse = ''" class="mt-2">
                          Limpiar filtros
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  <TableRow v-for="sale in sales.data" :key="sale.id" class="border-b transition-colors hover:bg-blue-50/30">
                    <TableCell class="font-medium"># {{ sale.id }}</TableCell>
                    <TableCell>{{ formatDate(sale.date) }}</TableCell>
                    <TableCell>{{ sale.customerName }}</TableCell>
                    <TableCell>{{ getPaymentMethodName(sale.paymentMethodId) }}</TableCell>
                    <TableCell>{{ formatPrice(sale.total) }}</TableCell>
                    <TableCell>
                      <div class="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600" @click="router.get(`/sales/${sale.id}`)" title="Ver detalles">
                          <Eye class="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>

          <CardFooter class="flex items-center justify-between px-6 py-4 bg-gray-50 border-t mt-auto">
            <p class="text-sm text-muted-foreground">
              Mostrando {{ (meta.currentPage - 1) * meta.perPage + 1 }} a
              {{ Math.min(meta.currentPage * meta.perPage, meta.total) }} de {{ meta.total }} ventas
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
                  <div class="flex gap-0 absolute left-0 right-0 justify-center">
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
      </template>
    </template>
  </div>
</template>
