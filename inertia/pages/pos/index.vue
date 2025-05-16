<template>

  <Head title="Ventas" />

  <!-- Vista para cuando no hay almacenes registrados -->
  <div v-if="!warehouses.length" class="flex flex-col items-center justify-center min-h-screen p-6">
    <div class="bg-gray-50 rounded-full p-2 mb-2">
      <Store class="h-16 w-16 text-blue-400" />
    </div>
    <h2 class="text-2xl font-semibold text-gray-800 mb-3">No hay almacenes registrados</h2>
    <p class="text-gray-500 max-w-lg mb-8 text-center">Necesitas crear al menos un almacén tipo tienda para poder realizar ventas.</p>
    <Link href="/warehouses/create">
    <Button class="bg-blue-700 hover:bg-blue-800">
      <span class="mr-2">+</span>
      Crear almacén
    </Button>
    </Link>
  </div>

  <!-- Contenido normal del POS cuando hay almacenes -->
  <div v-else>
    <!-- Campo oculto para capturar códigos de barras -->
    <input ref="barcodeInput" type="text" class="absolute opacity-0" @keydown="handleBarcodeInput" :disabled="!isBarcodeMode" autofocus />
    <div class="flex-1 flex min-h-[calc(100vh-4rem)] overflow-hidden">
      <!-- Products Section -->
      <div class="flex-1 pr-6">
        <!-- Categories -->
        <div class="flex justify-between items-center mb-2">
          <ScrollArea class="w-[500px] h-fit">
            <Tabs v-model="selectedCategory" class="mb-2">
              <TabsList>
                <TabsTrigger value="todos" class="px-4">Todos los productos</TabsTrigger>
                <TabsTrigger v-for="category in categories" :key="category.id" :value="category.categoryName" class="px-4">{{ category.categoryName }}</TabsTrigger>
              </TabsList>
            </Tabs>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <!-- Botón de lector de códigos de barras -->
          <Button variant="outline" :class="{ 'bg-blue-100 text-blue-800 border-blue-300': isBarcodeMode }" @click="toggleBarcodeMode">
            <Barcode v-if="isBarcodeMode" class="h-5 w-5 mr-1" />
            <ScanBarcode v-else class="h-5 w-5 mr-1" />
            {{ isBarcodeMode ? 'Lector activo' : 'Activar lector' }}
          </Button>
        </div>

        <ScrollArea class="h-[calc(100vh-10rem)]">
          <!-- Mensaje cuando no hay productos en la categoría -->
          <div v-if="filteredProducts.length === 0" class="flex flex-col items-center justify-center min-h-[60vh] py-10 px-4">
            <div class="bg-gray-50 rounded-full p-2 mb-2">
              <Package class="h-12 w-12 text-blue-400" />
            </div>
            <h2 class="text-xl font-semibold text-gray-700 mb-3">
              {{ selectedCategory === 'todos' 
                ? 'No hay productos disponibles' 
                : `No hay productos en la categoría "${selectedCategory}"` }}
            </h2>
            <p class="text-gray-500 mb-6 text-center max-w-md">
              {{ selectedCategory === 'todos' 
                ? 'No se encontraron productos disponibles en este almacén.' 
                : 'Intenta seleccionar otra categoría o revisar el inventario en este almacén.' }}
            </p>
            <div class="flex gap-4">
              <Button variant="outline" @click="selectedCategory = 'todos'" v-if="selectedCategory !== 'todos'">
                Ver todos los productos
              </Button>
            </div>
          </div>

          <!-- Products Grid -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <Card v-for="product in filteredProducts" :key="product.id" class="relative overflow-hidden transition-all duration-200" :class="{
                    'cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:bg-blue-50/30': !product.disabled,
                    'cursor-not-allowed opacity-75': product.disabled,
                  }" @click="handleProductClick(product)">
              <div class="aspect-square relative">
                <img :src="`inertia/public/products/${product.imagePath}`" :alt="product.productName" class="w-full h-full object-cover" />

                <!-- Stock Badge - Solo mostrar para productos con inventario -->
                <Badge v-if="product.hasInventory" class="absolute top-2 right-2 text-xs sm:text-sm" :class="{
                  'bg-blue-100 text-blue-800': product.currentInventory?.stockStatus === 'available',
                  'bg-amber-100 text-amber-800': product.currentInventory?.stockStatus === 'low',
                  'bg-rose-100 text-rose-800': product.currentInventory?.stockStatus === 'out_of_stock'
                }">
                  Stock: {{ product.currentInventory?.stock || 0 }}
                </Badge>

                <!-- Unidad de medida - Solo mostrar para productos sin inventario -->
                <Badge v-else class="absolute top-2 right-2 text-xs sm:text-sm bg-blue-100 text-blue-800">
                  {{ product.unit?.abbreviation }}
                </Badge>

                <div class="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <div class="font-bold text-sm sm:text-base md:text-lg line-clamp-2">{{ product.productName }}</div>
                  <div class="flex justify-between items-center">
                    <div class="text-sm sm:text-base">${{ formatPrice(product.price) }}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </div>

      <!-- Cart Section -->
      <div class="w-96 bg-white p-6 border-l sticky top-0 flex flex-col">
        <!-- Cart Items -->
        <div class="mb-6">
          <div class="text-lg font-semibold mb-4">
            Venta actual
            <Select v-model="selectedWarehouse" class="ml-4 w-48 inline-block">
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar almacén" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                  {{ warehouse.name }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <ScrollArea class="h-[calc(100vh-25rem)]">
            <div class="space-y-2">
              <div v-for="(item, index) in cart" :key="index" class="flex items-center justify-between p-3 bg-gray-50 rounded group hover:bg-blue-50/30 transition-colors duration-200">
                <div>
                  <div class="font-medium">{{ item.name }}</div>
                  <div class="text-sm text-gray-500">${{ formatPrice(item.price) }}</div>
                </div>
                <div class="flex items-center gap-2">
                  <Button variant="ghost" size="icon" class="h-8 w-8 hover:bg-blue-100 hover:text-blue-600" @click="decrementQuantity(item)">
                    <Minus class="h-4 w-4" />
                  </Button>
                  <Badge variant="secondary">{{ item.quantity }}</Badge>
                  <Button variant="ghost" size="icon" class="h-8 w-8 hover:bg-blue-100 hover:text-blue-600" @click="incrementQuantity(item)" :disabled="!canIncrementQuantity(item)">
                    <Plus class="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" class="h-8 w-8 hover:bg-red-100 hover:text-red-600" @click="removeFromCart(item)">
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <!-- Agregar botón para limpiar carrito -->
        <Button v-if="cart.length > 0" variant="destructive" class="w-full mb-4 bg-red-600 hover:bg-red-700" @click="clearCart">
          Limpiar carrito
        </Button>

        <!-- Total and Actions -->
        <div class="space-y-4 mt-auto">
          <div class="text-lg font-semibold flex justify-between">
            <span>Total</span>
            <span>${{ formatPrice(totalAmount) }}</span>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-3 gap-2">
              <Button variant="outline" :class="{ 
                'ring-2 ring-blue-700': selectedPaymentMethod === 'cash',
                'hover:bg-blue-50': selectedPaymentMethod !== 'cash'
              }" @click="handleCashPayment">
                <div class="flex items-center gap-1">
                  <Banknote class="h-5 w-5" />
                  <span>Efectivo</span>
                </div>
              </Button>
              <Button variant="outline" :class="{ 'ring-2 ring-primary': selectedPaymentMethod === 'debit' }" @click="selectedPaymentMethod = 'debit'">
                <div class="flex items-center gap-1">
                  <CreditCard class="h-5 w-5" />
                  <span>Débito</span>
                </div>
              </Button>
              <Button variant="outline" :class="{ 'ring-2 ring-primary': selectedPaymentMethod === 'credit' }" @click="selectedPaymentMethod = 'credit'">
                <div class="flex items-center gap-1">
                  <CreditCard class="h-5 w-5" />
                  <span>Crédito</span>
                </div>
              </Button>
            </div>

            <!-- Mostrar el cambio en el carrito si hay efectivo recibido -->
            <div v-if="selectedPaymentMethod === 'cash' && change > 0" class="mt-4 p-3 bg-blue-50 rounded-lg text-blue-800">
              <div class="flex justify-between items-center">
                <span class="font-medium">Efectivo recibido:</span>
                <span>${{ formatPrice(cashReceived) }}</span>
              </div>
              <div class="flex justify-between items-center mt-2">
                <span class="font-medium">Cambio:</span>
                <span class="text-lg font-bold">${{ formatPrice(change) }}</span>
              </div>
            </div>

            <Button variant="default" class="w-full bg-blue-700 hover:bg-blue-800 text-white" size="lg" :disabled="!isPaymentValid || cart.length === 0" @click="handleSubmit">
              <ShoppingBag class="mr-2 h-5 w-5" />
              Procesar Venta
            </Button>
          </div>
        </div>
      </div>

      <!-- Modal de Respuesta -->
      <Dialog :open="showModal" @update:open="closeModal">
        <DialogContent class="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle class="flex items-center gap-1">
              <div class="p-2 rounded-full" :class="responseStatus.success ? 'bg-blue-100' : 'bg-red-100'">
                <CheckCircle2 v-if="responseStatus.success" class="w-6 h-6 text-blue-600" />
                <XCircle v-else class="w-6 h-6 text-red-600" />
              </div>
              <span class="text-xl">
                {{ responseStatus.success ? 'Venta Exitosa' : 'Error en la Venta' }}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div class="p-2">
            <p class="text-lg" :class="responseStatus.success ? 'text-blue-700' : 'text-red-700'">
              {{ responseStatus.message }}
            </p>

            <div v-if="responseStatus.success" class="mt-4 space-y-4">
              <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex justify-between items-center text-sm text-gray-600">
                  <span>Método de pago</span>
                  <span class="capitalize">{{
                        getPaymentMethodName(selectedPaymentMethod)
                      }}</span>
                </div>
                <div class="flex justify-between items-center mt-2 font-semibold">
                  <span>Total pagado</span>
                  <span>${{ formatPrice(totalAmount) }}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button @click="closeModal">
              {{ responseStatus.success ? 'Continuar' : 'Cerrar' }}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Modal de Pago en Efectivo -->
      <Dialog :open="showCashModal" @update:open="closeCashModal">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pago en Efectivo</DialogTitle>
            <DialogDescription>
              Total a pagar: ${{ formatPrice(totalAmount) }}
            </DialogDescription>
          </DialogHeader>

          <div class="p-4 space-y-4">
            <div class="space-y-2">
              <Label>Efectivo recibido</Label>
              <div class="flex gap-2">
                <div class="relative flex-1">
                  <span class="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input type="number" v-model="cashReceived" class="pl-7" placeholder="0" :min="totalAmount" />
                </div>
              </div>
              <!-- Botones de cantidad rápida -->
              <div class="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" v-for="amount in quickAmounts" :key="amount" @click="cashReceived = amount" :class="{ 'ring-2 ring-blue-700': cashReceived === amount }">
                  ${{ formatPrice(amount) }}
                </Button>
              </div>
            </div>

            <!-- Cambio -->
            <div v-if="change > 0" class="flex justify-between items-center p-3 bg-blue-50 rounded-lg text-blue-800">
              <span class="font-medium">Cambio a devolver:</span>
              <span class="text-lg font-bold">${{ formatPrice(change) }}</span>
            </div>
          </div>

          <DialogFooter class="flex justify-between gap-2">
            <Button variant="outline" @click="closeCashModal">Cancelar</Button>
            <Button class="bg-blue-700 hover:bg-blue-800" :disabled="!isCashPaymentValid" @click="confirmCashPayment">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <!-- Modal para productos sin inventario -->
      <Dialog :open="showQuantityModal" @update:open="closeQuantityModal">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cantidad de {{ selectedProduct?.productName }}</DialogTitle>
            <DialogDescription>
              Precio por {{ selectedProduct?.unit?.name }}: ${{ formatPrice(selectedProduct?.price) }}
            </DialogDescription>
          </DialogHeader>

          <div class="p-4 space-y-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">Cantidad ({{ selectedProduct?.unit?.name }})</label>
              <Input v-model="quantityInput" type="number" :step="selectedProduct?.unit?.precision" :min="selectedProduct?.unit?.precision" @input="validateQuantityInput" />
            </div>

            <div class="text-sm text-muted-foreground">
              Precisión máxima: {{ selectedProduct?.unit?.precision }} {{ selectedProduct?.unit?.name }}
            </div>

            <div class="font-semibold text-lg">
              Total: ${{ formatPrice(calculateTotal) }}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="closeQuantityModal">Cancelar</Button>
            <Button @click="addNonInventoryProductToCart" :disabled="!isValidQuantity">
              Agregar al carrito
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import {
  ShoppingCart,
  Home,
  Receipt,
  Clock,
  Tag,
  User,
  Search,
  XCircle,
  Trash2,
  Plus,
  Minus,
  Banknote,
  CreditCard,
  ShoppingBag,
  CheckCircle2,
  Pencil,
  PencilIcon,
  ScanBarcode,
  Barcode,
  Store,
  Package,
} from 'lucide-vue-next'

import { Head, router, usePage, Link } from '@inertiajs/vue3'
import { useToast } from '~/components/ui/toast/use-toast'
import { Button } from '~/components/ui/button'

const page = usePage()
const userRole = ref(page.props.user.roleId)

const layout = computed(() => {
  return userRole.value === 1 ? AdminLayout : SellerLayout
})

const products = ref(page.props.products || [])
const categories = ref(page.props.categories || [])
const warehouses = ref(page.props.warehouses || [])

// Estado para el formulario de categoría
const isCreatingCategory = ref(false)
const showcategoryFormModal = ref(false)
const categoryForm = ref({
  name: '',
})

const selectedCategory = ref('todos')
const cart = ref([])

// Estado para el modal
const showModal = ref(false)
const responseStatus = ref({
  success: false,
  message: '',
})

const selectedPaymentMethod = ref(null)
const selectedWarehouse = ref(warehouses.value?.[0]?.id || null)

const { toast } = useToast()

// Estado para el pago en efectivo
const cashReceived = ref(0)

// Montos rápidos para seleccionar
const quickAmounts = computed(() => {
  const amounts = [1000, 2000, 5000, 10000, 20000]
  return amounts.filter(amount => amount >= totalAmount.value)
})

// Calcular el cambio
const change = computed(() => {
  if (selectedPaymentMethod.value !== 'cash' || !cashReceived.value) return 0
  return Math.max(0, cashReceived.value - totalAmount.value)
})

// Validar si el pago es válido
const isPaymentValid = computed(() => {
  if (!selectedPaymentMethod.value || cart.length === 0) return false
  if (selectedPaymentMethod.value === 'cash') {
    return cashReceived.value >= totalAmount.value
  }
  return true
})

// Estado para el modo de lectura de códigos de barras
const isBarcodeMode = ref(false)

// Función para activar/desactivar el modo de lectura de códigos de barras
const toggleBarcodeMode = () => {
  isBarcodeMode.value = !isBarcodeMode.value
  if (isBarcodeMode.value) {
    // Cuando se active el modo, enfocar el input
    setTimeout(() => {
      if (barcodeInput.value) {
        barcodeInput.value.focus()
      }
    }, 100)
    
    toast({
      title: 'Lector de códigos activado',
      description: 'Escanee un código de barras para agregar un producto.',
      duration: 3000,
    })
  } else {
    toast({
      title: 'Lector de códigos desactivado',
      duration: 2000,
    })
  }
}

// Cargar carrito desde localStorage al montar el componente
onMounted(() => {
  const savedCart = localStorage.getItem('cart')
  if (savedCart) {
    cart.value = JSON.parse(savedCart)
  }
  window.addEventListener('keydown', handleBarcodeInput)
})

// Guardar carrito en localStorage cuando cambie
watch(
  cart,
  (newCart) => {
    localStorage.setItem('cart', JSON.stringify(newCart))
  },
  { deep: true }
)

// Agregar este computed para calcular el stock disponible
const getAvailableStock = (productId) => {
  const product = products.value.find((p) => p.id === productId)

  if (!product || !product.inventory || !selectedWarehouse.value) return 0

  const inventory = product.inventory[selectedWarehouse.value]
  if (!inventory) return 0

  return inventory.stock
}

// Función para verificar si se puede incrementar la cantidad
const canIncrementQuantity = (item) => {
  const availableStock = getAvailableStock(item.id)
  return availableStock > 0
}

// Función para verificar si el producto se puede agregar al carrito
const canAddToCart = (product) => {
  if (!selectedWarehouse.value) return false
  
  const inventory = product.inventory[selectedWarehouse.value]
  if (!inventory) return false

  const availableStock = getAvailableStock(product.id)
  return availableStock > 0 && inventory.stockStatus !== 'out_of_stock'
}

const addToCart = (product) => {
  if (!canAddToCart(product)) return

  const existingItem = cart.value.find((item) => item.id === product.id)

  if (existingItem) {
    if (canIncrementQuantity(existingItem)) {
      existingItem.quantity++
      existingItem.totalPrice = existingItem.price * existingItem.quantity
    }
  } else {
    cart.value.push({
      id: product.id,
      name: product.productName,
      price: product.price,
      totalPrice: product.price,
      quantity: 1,
      warehouseId: selectedWarehouse.value,
      hasInventory: product.hasInventory,
      unit: product.unit
    })
  }

  // Actualizar el stock mostrado en la tarjeta del producto
  if (product.inventory && selectedWarehouse.value) {
    const inventory = product.inventory[selectedWarehouse.value]
    if (inventory) {
      inventory.stock -= 1
      inventory.stockStatus = inventory.stock <= 0 ? 'out_of_stock' : 
                             inventory.stock <= inventory.criticalStock ? 'low' : 'available'
    }
  }
}

const addNonInventoryProductToCart = () => {
  if (!selectedProduct.value || !isValidQuantity.value) return

  const quantity = Number(quantityInput.value)
  const product = selectedProduct.value

  cart.value.push({
    id: product.id,
    name: product.productName,
    price: product.price,
    quantity,
    total: product.price * quantity,
    hasInventory: false,
    warehouseId: selectedWarehouse.value,
    unit: product.unit
  })

  closeQuantityModal()
  toast({
    title: 'Producto agregado',
    description: `Se agregó ${quantity} ${product.unit.name} de ${product.productName} al carrito`,
    duration: 3000,
  })
}

const incrementQuantity = (item) => {
  if (canIncrementQuantity(item)) {
    item.quantity++
    item.totalPrice = item.price * item.quantity

    // Actualizar el stock en la tarjeta del producto
    const product = products.value.find(p => p.id === item.id)
    if (product && product.inventory && selectedWarehouse.value) {
      const inventory = product.inventory[selectedWarehouse.value]
      if (inventory) {
        inventory.stock -= 1
        inventory.stockStatus = inventory.stock <= 0 ? 'out_of_stock' : 
                               inventory.stock <= inventory.criticalStock ? 'low' : 'available'
      }
    }
  }
}

const decrementQuantity = (item) => {
  if (item.quantity > 1) {
    item.quantity--
    item.totalPrice = item.price * item.quantity

    // Restaurar el stock en la tarjeta del producto
    const product = products.value.find(p => p.id === item.id)
    if (product && product.inventory && selectedWarehouse.value) {
      const inventory = product.inventory[selectedWarehouse.value]
      if (inventory) {
        inventory.stock += 1
        inventory.stockStatus = inventory.stock <= 0 ? 'out_of_stock' : 
                               inventory.stock <= inventory.criticalStock ? 'low' : 'available'
      }
    }
  } else {
    removeFromCart(item)
  }
}

const removeFromCart = (item) => {
  const index = cart.value.indexOf(item)
  if (index > -1) {
    // Restaurar el stock en la tarjeta del producto
    const product = products.value.find(p => p.id === item.id)
    if (product && product.inventory && selectedWarehouse.value) {
      const inventory = product.inventory[selectedWarehouse.value]
      if (inventory) {
        inventory.stock += item.quantity
        inventory.stockStatus = inventory.stock <= 0 ? 'out_of_stock' : 
                               inventory.stock <= inventory.criticalStock ? 'low' : 'available'
      }
    }
    cart.value.splice(index, 1)
  }
}

const clearCart = () => {
  cart.value = []
}

// Modificar el computed de filteredProducts para incluir información del stock
const filteredProducts = computed(() => {
  let filtered = products.value || []

  // Luego aplicar el filtro de categoría
  if (selectedCategory.value !== 'todos') {
    filtered = filtered.filter(
      product => product.category && product.category.categoryName === selectedCategory.value
    )
  }

  return filtered.map(product => {
    // Si el producto no tiene inventario, siempre está disponible
    if (!product.hasInventory) {
      return {
        ...product,
        disabled: false,
        currentInventory: null
      }
    }

    // Si tiene inventario, verificar el almacén seleccionado
    if (!selectedWarehouse.value) {
      return {
        ...product,
        disabled: true,
        currentInventory: null
      }
    }

    // Verificar el inventario en el almacén seleccionado
    const warehouseInventory = product.inventory[selectedWarehouse.value]
    return {
      ...product,
      disabled: !warehouseInventory || warehouseInventory.stock <= 0,
      currentInventory: warehouseInventory || null
    }
  })
})

const totalAmount = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const formatPrice = (price) => {
  if (!price && price !== 0) return '0'
  return price.toLocaleString()
}

const closeModal = () => {
  showModal.value = false
  if (responseStatus.value.success) {
    cart.value = [] // Limpiar carrito después de una venta exitosa
  }
}

// Función para actualizar el stock localmente
const updateLocalStock = (saleItems) => {
  // Ya no necesitamos actualizar el stock aquí porque ya se actualizó visualmente
  // cuando se agregaron los productos al carrito
}

// Función para cambiar contraseña
const handleSubmit = () => {
  router.post(
    '/pos',
    {
      saleItems: cart.value.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        warehouseId: selectedWarehouse.value,
        hasInventory: item.hasInventory
      })),
      paymentMethodId: getPaymentMethodId(selectedPaymentMethod.value),
      warehouseId: selectedWarehouse.value,
    },
    {
      onSuccess: (page) => {
        const success = page.props.success
        const message = page.props.message

        responseStatus.value = {
          success,
          message,
        }
        showModal.value = true
      },
      onError: (errors) => {
        responseStatus.value = {
          success: false,
          message: errors.message || 'Error al procesar la venta',
        }
        showModal.value = true
      },
      preserveScroll: true,
    }
  )
}

const getPaymentMethodName = (methodId) => {
  const method = {
    cash: 'Efectivo',
    debit: 'Débito',
    credit: 'Crédito',
  }
  return method[methodId] || 'Método de pago desconocido'
}

const getPaymentMethodId = (methodType) => {
  const method = {
    cash: 1,
    debit: 2,
    credit: 3,
  }
  return method[methodType] || null
}

const getStockBadgeVariant = (status) => {
  if (status === 'out_of_stock' || status === 0) return 'destructive'
  if (status === 'low') return 'warning'
  return 'default'
}

const handleProductClick = (product) => {
  if (product.disabled) {
    toast({
      variant: 'destructive',
      title: 'Producto no disponible',
      description: `${product.productName} no tiene stock disponible.`,
      duration: 3000,
    })
    return
  }

  if (!product.hasInventory) {
    selectedProduct.value = product
    quantityInput.value = product.unit?.precision || 1
    showQuantityModal.value = true
    return
  }

  // Lógica existente para productos con inventario
  if (canAddToCart(product)) {
    addToCart(product)
  }
}

const createCategory = () => {
  isCreatingCategory.value = true

  // Verificar si ya existe una categoría con el mismo nombre
  const categoryExists = categories.some(
    (cat) => cat.categoryName.toLowerCase().trim() === categoryForm.value.name.toLowerCase().trim()
  )

  if (categoryExists) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'Ya existe una categoría con este nombre.',
      duration: 3000,
    })
    isCreatingCategory.value = false
    return
  }

  router.post('/categories', categoryForm.value, {
    preserveScroll: true,
    onSuccess: (page) => {
      isCreatingCategory.value = false
      showcategoryFormModal.value = false

      // Seleccionar la nueva categoría
      const newCategory = page.props.categories[page.props.categories.length - 1]
      if (newCategory) {
        selectedCategory.value = newCategory.categoryName
      }

      // Mostrar toast de éxito
      toast({
        title: 'Categoría creada',
        description: `La categoría "${categoryForm.value.name}" ha sido creada exitosamente.`,
        duration: 3000,
      })

      // Limpiar el formulario
      categoryForm.value.name = ''
    },
    onError: (errors) => {
      isCreatingCategory.value = false
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errors.message || 'Error al crear la categoría.',
        duration: 3000,
      })
    },
  })
}

// Agregar un watch para products y warehouses para asegurar que siempre haya un almacén seleccionado
watch(warehouses, (newWarehouses) => {
  if (!selectedWarehouse.value && newWarehouses?.length > 0) {
    selectedWarehouse.value = newWarehouses[0].id
  }
}, { immediate: true })

// Reset cashReceived cuando cambia el total
watch(totalAmount, () => {
  cashReceived.value = 0
})

const showCashModal = ref(false)

const handleCashPayment = () => {
  cashReceived.value = 0
  showCashModal.value = true
}

const closeCashModal = () => {
  showCashModal.value = false
  if (!isCashPaymentValid.value) {
    selectedPaymentMethod.value = null
    cashReceived.value = 0
  }
}

const confirmCashPayment = () => {
  selectedPaymentMethod.value = 'cash'
  showCashModal.value = false
}

const isCashPaymentValid = computed(() => {
  return cashReceived.value >= totalAmount.value
})

// Agregar un watch para selectedWarehouse
watch(selectedWarehouse, (newWarehouseId, oldWarehouseId) => {
  // Limpiar el carrito cuando se cambia de almacén
  if (cart.value.length > 0) {
    // Restaurar el stock de los productos en el almacén anterior
    cart.value.forEach(item => {
      const product = products.value.find(p => p.id === item.id)
      if (product && product.inventory && oldWarehouseId) {
        const inventory = product.inventory[oldWarehouseId]
        if (inventory) {
          inventory.stock += item.quantity
          inventory.stockStatus = inventory.stock <= 0 ? 'out_of_stock' : 
                                 inventory.stock <= inventory.criticalStock ? 'low' : 'available'
        }
      }
    })

    // Limpiar el carrito y mostrar un mensaje
    toast({
      title: 'Cambio de almacén',
      description: 'El carrito ha sido limpiado debido al cambio de almacén.',
      duration: 3000,
    })
    cart.value = []
  }
}, { immediate: true })

// Agregar después de las otras refs
const barcodeInput = ref('')
const barcodeTimeout = ref(null)

// Remove duplicate ref declarations and merge into a single declaration section
const showQuantityModal = ref(false)
const selectedProduct = ref(null)
const quantityInput = ref('')
const scannedProduct = ref(null)
const scannedQuantity = ref(1)
const scannedProductBarcodeState = ref(false)

// Función para manejar la lectura de códigos de barras
const handleBarcodeInput = (event) => {
  // Si el modo de lectura está desactivado, no hacer nada
  if (!isBarcodeMode.value) return
  
  // Ignorar teclas especiales como Enter, Shift, Ctrl, etc.
  if (event.key === 'Enter' || event.key.length > 1) {
    return
  }

  // Limpiar el timeout anterior si existe
  if (barcodeTimeout.value) {
    clearTimeout(barcodeTimeout.value)
  }

  // Agregar solo el carácter actual al input (no el objeto completo)
  if (!barcodeInput.value) {
    barcodeInput.value = event.key
  } else {
    barcodeInput.value += event.key
  }

  // Establecer un nuevo timeout
  barcodeTimeout.value = setTimeout(() => {
    // Si el input no está vacío, procesar el código
    if (barcodeInput.value.trim()) {
      processBarcode(barcodeInput.value.trim())
      // Limpiar el input
      barcodeInput.value = ''
    }
  }, 100) // 100ms de espera para considerar que se completó la lectura
}

// Función para procesar el código de barras
const processBarcode = (barcode) => {
  console.log('Barcode escaneado:', barcode)
  
  // Extraer el código real del texto
  let code = barcode
  
  // Si contiene "HTMLInputElement", extraer solo la parte del código
  if (barcode.includes('HTMLInputElement]')) {
    code = barcode.split('HTMLInputElement]')[1]
  }
  
  console.log('Código real extraído:', code)
  
  const product = products.value.find(p => String(p.sku).trim() === code)
  
  if (product) {
    // Verificar si hay stock disponible
    if (canAddToCart(product)) {
      // Desactivar temporalmente el lector de códigos
      const wasActive = isBarcodeMode.value
      if (wasActive) {
        isBarcodeMode.value = false
      }
      
      // Guardar el producto escaneado y mostrar el modal de cantidad
      scannedProduct.value = product
      scannedQuantity.value = 1
      showQuantityModal.value = true
      
      // Guardar el estado anterior para restaurarlo después
      scannedProductBarcodeState.value = wasActive
    } else {
      toast({
        variant: 'destructive',
        title: 'Producto sin stock',
        description: `${product.productName} no tiene stock disponible.`,
        duration: 3000,
      })
    }
  } else {
    // Si no se encuentra el producto, mostrar error
    toast({
      variant: 'destructive',
      title: 'Producto no encontrado',
      description: 'No se encontró ningún producto con este código.',
      duration: 3000,
    })
  }
}

// Estado para el modal de cantidad después de escanear
const maxAvailableStock = computed(() => {
  if (!scannedProduct.value || !selectedWarehouse.value) return 0
  
  const inventory = scannedProduct.value.inventory?.[selectedWarehouse.value]
  return inventory ? inventory.stock : 0
})

const incrementScannedQuantity = () => {
  if (scannedQuantity.value < maxAvailableStock.value) {
    scannedQuantity.value++
  }
}

const decrementScannedQuantity = () => {
  if (scannedQuantity.value > 1) {
    scannedQuantity.value--
  }
}

// Replace both closeQuantityModal functions with this unified version
const closeQuantityModal = () => {
  showQuantityModal.value = false
  
  // Restore barcode mode if it was active
  if (scannedProductBarcodeState.value) {
    setTimeout(() => {
      isBarcodeMode.value = true
      if (barcodeInput.value) {
        barcodeInput.value.focus()
      }
    }, 100)
  }
  
  // Clean up all related states
  selectedProduct.value = null
  quantityInput.value = ''
  scannedProduct.value = null
  scannedQuantity.value = 1
  scannedProductBarcodeState.value = false
}

const confirmAddScannedProduct = () => {
  if (scannedProduct.value && scannedQuantity.value > 0) {
    // Buscar si el producto ya está en el carrito
    const existingItem = cart.value.find(item => item.id === scannedProduct.value.id)
    
    if (existingItem) {
      // Si ya existe, incrementar la cantidad
      const availableStock = getAvailableStock(existingItem.id)
      const newQuantity = existingItem.quantity + scannedQuantity.value
      
      if (newQuantity <= availableStock + existingItem.quantity) {
        existingItem.quantity = newQuantity
        existingItem.totalPrice = existingItem.price * existingItem.quantity
      } else {
        toast({
          variant: 'destructive',
          title: 'Stock insuficiente',
          description: `Solo hay ${availableStock} unidades disponibles.`,
          duration: 3000,
        })
        closeQuantityModal()
        return
      }
    } else {
      // Si no existe, agregarlo al carrito
      cart.value.push({
        id: scannedProduct.value.id,
        name: scannedProduct.value.productName,
        price: scannedProduct.value.price,
        totalPrice: scannedProduct.value.price * scannedQuantity.value,
        quantity: scannedQuantity.value,
        warehouseId: selectedWarehouse.value
      })
    }
    
    // Actualizar el stock mostrado en la tarjeta del producto
    if (scannedProduct.value.inventory && selectedWarehouse.value) {
      const inventory = scannedProduct.value.inventory[selectedWarehouse.value]
      if (inventory) {
        inventory.stock -= scannedQuantity.value
        inventory.stockStatus = inventory.stock <= 0 ? 'out_of_stock' : 
                              inventory.stock <= inventory.criticalStock ? 'low' : 'available'
      }
    }
    
    toast({
      title: 'Producto agregado',
      description: `${scannedProduct.value.productName} (${scannedQuantity.value}) agregado al carrito.`,
      duration: 2000,
    })
  }
  
  closeQuantityModal()
}

// Remover el evento cuando el componente se desmonta
onUnmounted(() => {
  window.removeEventListener('keydown', handleBarcodeInput)
  if (barcodeTimeout.value) {
    clearTimeout(barcodeTimeout.value)
  }
})


// Unidades

// Computed para el total
const calculateTotal = computed(() => {
  if (!selectedProduct.value || !quantityInput.value) return 0
  return selectedProduct.value.price * Number(quantityInput.value)
})

// Computed para validar la cantidad
const isValidQuantity = computed(() => {
  if (!selectedProduct.value?.unit?.precision) return false
    
  const precision = selectedProduct.value.unit.precision
  const quantity = Number(quantityInput.value)
  
  if (quantity <= 0) return false

  // Redondear al número de decimales de la precisión
  const decimals = Math.max(0, -Math.floor(Math.log10(precision)))
  const roundedQuantity = Number(quantity.toFixed(decimals))
  
  // Verificar si el número redondeado es igual al número original
  return Math.abs(roundedQuantity - quantity) < Number.EPSILON
})

// Función para validar la entrada de cantidad
const validateQuantityInput = () => {
  if (!selectedProduct.value?.unit?.precision) return
  
  const precision = selectedProduct.value.unit.precision
  const value = Number(quantityInput.value)
  
  // Redondear al número de decimales de la precisión
  const decimals = Math.max(0, -Math.floor(Math.log10(precision)))
  quantityInput.value = Number(value.toFixed(decimals))
}
</script>

<style scoped>
.disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

:deep(.badge-warning) {
  background-color: #f59e0b;
  color: white;
}
</style>
