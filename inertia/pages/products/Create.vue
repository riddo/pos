<template>
  <Head title="Crear producto" />
  <div>
    <div class="max-w-screen-2xl mx-auto p-6 space-y-8 rounded-lg">
      <!-- Título principal -->
      <div>
        <h2 class="text-3xl font-bold">Añadir Producto</h2>
        <p class="text-muted-foreground">Completa los detalles del nuevo producto</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Modificar la estructura del grid principal -->
        <div class="grid grid-cols-5 gap-4">
          <!-- Primera columna: Detalles del producto (3 columnas) -->
          <div class="col-span-3 space-y-4 grid grid-cols-1 h-full">
            <div class="space-y-2">
              <label class="text-sm font-medium">Nombre del producto</label>
              <Input v-model="form.name" placeholder="Ej: Café Americano" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Precio</label>
              <Input v-model="form.price" type="number" placeholder="0" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Descripción</label>
              <Textarea v-model="form.description" placeholder="Describe el producto" />
            </div>
          </div>

          <!-- Segunda columna: Imagen del producto (2 columnas) -->
          <div class="col-span-2 h-full">
            <Card class="p-4 h-full">
              <div class="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer h-full" @click="triggerFileInput" :class="{ 'border-primary': isDragging }" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop">
                <div v-if="!previewImage" class="text-center">
                  <ImagePlus class="w-12 h-12 mx-auto text-muted-foreground" />
                  <p class="mt-2 text-sm">Arrastra una imagen o haz click para seleccionar</p>
                  <p class="text-xs text-muted-foreground">PNG, JPG hasta 5MB</p>
                </div>
                <img v-else :src="previewImage" class="max-h-48 rounded" alt="Preview" />
              </div>
              <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleImageChange" />
            </Card>
          </div>
        </div>

        <!-- Resto de campos que se extienden horizontalmente -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-sm font-medium">SKU</label>
            <Input v-model="form.sku" placeholder="Ej: CAFE-001" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Categoría</label>
            <div class="flex items-center gap-2">
              <Select v-model="form.category">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Categorías</SelectLabel>
                    <SelectItem v-for="cat in categories" :key="cat.id" :value="String(cat.id)">
                      {{ cat.categoryName }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button type="button" variant="outline" @click="opencategoryFormModal">
                <Plus class="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Unidad de medida</label>
            <Select v-model="form.unitId" required>
              <SelectTrigger class="w-full">
                <SelectValue :placeholder="selectedUnit?.name || 'Seleccionar unidad'" />
              </SelectTrigger>
              <SelectContent>
                <template v-for="(units, category) in units" :key="category">
                  <SelectGroup>
                    <SelectLabel>{{ category }}</SelectLabel>
                    <SelectItem 
                      v-for="unit in units" 
                      :key="unit.id" 
                      :value="String(unit.id)"
                    >
                      {{ unit.name }}
                    </SelectItem>
                  </SelectGroup>
                </template>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Precisión</label>
            <Select 
              v-model="form.precision" 
              required
              :disabled="!canEditPrecision"
            >
              <SelectTrigger class="w-full">
                <SelectValue :placeholder="formatPrecision(form.precision)" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Precisión</SelectLabel>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="0.1">0,1</SelectItem>
                  <SelectItem value="0.01">0,01</SelectItem>
                  <SelectItem value="0.001">0,001</SelectItem>
                  <SelectItem value="0.0001">0,0001</SelectItem>
                  <SelectItem value="0.00001">0,00001</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-4">
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <Switch
                  v-model="form.hasInventory"
                  id="inventory-control"
                  :disabled="!canEnableInventory"
                />
                <label for="inventory-control" class="text-sm font-medium cursor-pointer">
                  Controlar inventario para este producto
                </label>
              </div>
              <div class="h-5"> 
                <p v-if="!canEnableInventory" class="text-sm text-red-500">
                  * Los productos vendidos en unidades distintas de "Cada uno" no pueden rastrearse
                </p>
              </div>
            </div>

            <div v-show="form.hasInventory" class="space-y-6">
              <div class="space-y-2">
                <label class="text-sm font-medium">Stock crítico (para todos los almacenes)</label>
                <Input 
                  v-model="form.criticalStock" 
                  type="number" 
                  placeholder="0" 
                  :required="form.hasInventory"
                />
              </div>

              <!-- Inventarios múltiples -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium">Inventarios iniciales</label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    @click="form.inventories.push({ initialStock: '', warehouseId: '' })"
                  >
                    <Plus class="w-4 h-4 mr-1" />
                    Agregar almacén
                  </Button>
                </div>

                <div v-for="(inventory, index) in form.inventories" :key="index" class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                  <div class="space-y-2">
                    <label class="text-sm font-medium">Stock inicial</label>
                    <Input 
                      v-model="inventory.initialStock" 
                      type="number" 
                      placeholder="0" 
                      :required="form.hasInventory"
                    />
                  </div>
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <label class="text-sm font-medium">Almacén</label>
                      <Button 
                        v-if="form.inventories.length > 1" 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        @click="form.inventories.splice(index, 1)"
                      >
                        Eliminar
                      </Button>
                    </div>
                    <Select 
                      v-model="inventory.warehouseId" 
                      :required="form.hasInventory"
                    >
                      <SelectTrigger class="w-full">
                        <SelectValue placeholder="Seleccionar almacén" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Almacenes</SelectLabel>
                          <SelectItem 
                            v-for="warehouse in availableWarehouses(index)" 
                            :key="warehouse.id" 
                            :value="String(warehouse.id)"
                          >
                            {{ warehouse.name }} ({{ warehouse.warehouseType === 'store' ? 'Tienda' : 'Bodega' }})
                          </SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex justify-end gap-4">
          <Link href="/products">
          <Button type="button" variant="outline"> Cancelar </Button>
          </Link>
          <Button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Guardando...' : 'Guardar producto' }}
          </Button>
        </div>
      </form>

      <!-- Modal para nueva categoría -->
      <Dialog :open="showcategoryFormModal" @update:open="showcategoryFormModal = false">
        <DialogContent class="sm:max-w-md">
          <DialogHeader>
            <DialogTitle class="text-xl flex items-center gap-2">
              <div class="rounded-full bg-blue-100 p-2 flex-shrink-0">
                <Plus class="h-4 w-4 text-[#1e40af]" />
              </div>
              Nueva categoría
            </DialogTitle>
            <DialogDescription class="text-gray-500 mt-1.5">
              Añade una nueva categoría para organizar tus productos
            </DialogDescription>
          </DialogHeader>
          <form @submit.prevent="createCategory" class="py-2">
            <div class="space-y-4 py-2">
              <div class="space-y-2">
                <label class="text-sm font-medium">Nombre de la categoría</label>
                <Input 
                  v-model="categoryForm.name" 
                  placeholder="Ej: Bebidas calientes" 
                  class="focus-visible:ring-[#1e40af]/40"
                  :class="{'border-[#1e40af]/30 shadow-sm': categoryForm.name.trim()}"
                />
                <p class="text-xs text-gray-500">
                  El nombre de la categoría se mostrará al clasificar tus productos
                </p>
              </div>
            </div>
            <DialogFooter class="mt-4 pt-3 border-t">
              <Button type="button" variant="outline" @click="showcategoryFormModal = false">
                Cancelar
              </Button>
              <Button 
                type="submit"
                :disabled="isCreatingCategory || !categoryForm.name.trim()"
                class="bg-[#2147c8] hover:bg-[#183494] focus:ring-[#1e40af]/50"
              >
                <svg v-if="isCreatingCategory" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isCreatingCategory ? 'Creando...' : 'Crear categoría' }}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { Head, router, usePage } from '@inertiajs/vue3'
import { ImagePlus, Plus } from 'lucide-vue-next'
import { useToast } from '~/components/ui/toast/use-toast'
import { Switch } from '~/components/ui/switch'
import { Card } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog'

const page = usePage()
const { errors } = page
console.log('errors',errors)
const categories = computed(() => page.props.categories)
const warehouses = computed(() => page.props.warehouses)
const units = computed(() => page.props.units)
const { toast } = useToast()

// Estado del formulario con `useForm`
const form = reactive({
  name: '',
  price: '',
  criticalStock: '',
  sku: '',
  description: '',
  category: '',
  image: null,
  hasInventory: false,
  unitId: Object.values(units.value).flat().find(u => u.name === 'Cada uno')?.id || '',
  precision: Object.values(units.value).flat().find(u => u.name === 'Cada uno')?.precision || 1,
  inventories: [
    {
      initialStock: '',
      warehouseId: '',
    }
  ]
})

const categoryForm = reactive({
  name: '',
})

// Estado para la imagen
const fileInput = ref(null)
const previewImage = ref(null)
const isDragging = ref(false)

// Estado para el modal
const showcategoryFormModal = ref(false)

// Estado de loading
const isCreatingCategory = ref(false)
const isSubmitting = ref(false)

// Computed para obtener la unidad seleccionada
const selectedUnit = computed(() => {
  return Object.values(units.value)
    .flat()
    .find(unit => String(unit.id) === form.unitId)
})

// Computed para controlar si se puede habilitar el control de inventario
const canEnableInventory = computed(() => {
  return selectedUnit.value?.name === 'Cada uno'
})

// Computed para determinar si la precisión se puede editar
const canEditPrecision = computed(() => {
  if (!selectedUnit.value) return false
  return selectedUnit.value.name !== 'Cada uno' && selectedUnit.value.category !== 'Tiempo'
})

// Función para formatear la precisión
const formatPrecision = (precision) => {
  if (precision === 1) return '1'
  return precision.toLocaleString('es-ES', { minimumFractionDigits: Math.abs(Math.log10(precision)) })
}

// Watch para actualizar la precisión cuando cambia la unidad
watch(() => form.unitId, (newUnitId) => {
  const unit = Object.values(units.value)
    .flat()
    .find(u => String(u.id) === newUnitId)
  
  if (unit) {
    form.precision = unit.precision
    if (unit.name !== 'Cada uno') {
      form.hasInventory = false
    }
  }
})

// Asegurarse de que la unidad por defecto esté seleccionada al montar el componente
onMounted(() => {
  const defaultUnit = Object.values(units.value).flat().find(u => u.name === 'Cada uno')
  if (defaultUnit) {
    form.unitId = String(defaultUnit.id)
    form.precision = defaultUnit.precision
  }
})

// Métodos para manejo de imágenes
const triggerFileInput = () => {
  fileInput.value.click()
}

const handleImageChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    form.image = file
    createPreview(file)
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files[0]
  if (file) {
    form.image = file
    createPreview(file)
  }
}

const createPreview = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// Métodos para el formulario
const handleSubmit = async () => {
  // Validar campos de inventario solo si hasInventory está activado
  if (form.hasInventory) {
    if (form.inventories.some(inv => !inv.initialStock || !inv.warehouseId)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor completa todos los campos de inventario',
        duration: 3000,
      })
      return
    }

    if (!form.criticalStock) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El stock crítico es obligatorio',
        duration: 3000,
      })
      return
    }
  }

  isSubmitting.value = true

  // Preparar los datos del formulario
  const formData = new FormData()
  formData.append('name', form.name)
  formData.append('price', form.price)
  formData.append('category', String(form.category))
  formData.append('description', form.description || '')
  formData.append('sku', form.sku || '')
  formData.append('hasInventory', String(form.hasInventory))
  formData.append('unitId', form.unitId)
  formData.append('precision', form.precision)

  // Agregar imagen si existe
  if (form.image) {
    formData.append('image', form.image)
  }

  // Solo agregar datos de inventario si hasInventory está activado
  if (form.hasInventory) {
    formData.append('criticalStock', form.criticalStock)
    form.inventories.forEach((inv, index) => {
      formData.append(`inventories[${index}][initialStock]`, inv.initialStock)
      formData.append(`inventories[${index}][warehouseId]`, String(inv.warehouseId))
    })
  }

  router.post('/products', formData, {
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: 'Producto creado correctamente',
        duration: 3000,
      })
      isSubmitting.value = false
    },
    onError: (errors) => {
      console.error('Error creating product:', errors)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Hubo un error al crear el producto',
        duration: 3000,
      })
      isSubmitting.value = false
    }
  })
}

// Métodos para categorías
const opencategoryFormModal = () => {
  showcategoryFormModal.value = true
}

const createCategory = async () => {
  if (!categoryForm.name.trim()) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'El nombre de la categoría es obligatorio.',
      duration: 3000,
    })
    return
  }

  // Verificar si ya existe una categoría con el mismo nombre
  const categoryExists = categories.value.some(
    (cat) => cat.categoryName.toLowerCase().trim() === categoryForm.name.toLowerCase().trim()
  )

  if (categoryExists) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'Ya existe una categoría con este nombre.',
      duration: 3000,
    })
    return
  }

  isCreatingCategory.value = true
  router.post('/categories', categoryForm, {
    preserveScroll: true,
    onSuccess: (response) => {
      // Obtener la nueva categoría directamente de la respuesta
      const newCategory = response.props.flash.categoryId
      
      // Esperar a que la categoría se actualice en el store
      setTimeout(() => {
        // Buscar la categoría recién creada por nombre, por si el ID no está disponible
        if (!newCategory) {
          const foundCategory = categories.value.find(
            cat => cat.categoryName.toLowerCase() === categoryForm.name.toLowerCase().trim()
          )
          if (foundCategory) {
            form.category = String(foundCategory.id)
          }
        } else {
          form.category = String(newCategory)
        }
        
        // Mostrar toast de éxito
        toast({
          title: 'Categoría creada',
          description: `La categoría "${categoryForm.name}" ha sido creada exitosamente.`,
          duration: 3000,
        })
        
        // Limpiar el formulario y cerrar modal
        categoryForm.name = ''
        showcategoryFormModal.value = false
        isCreatingCategory.value = false
      }, 300)
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

// Computed para filtrar almacenes disponibles
const availableWarehouses = (currentIndex) => {
  return warehouses.value.filter(warehouse => {
    // Excluir almacenes ya seleccionados en otros inventarios
    const selectedWarehouses = form.inventories
      .map((inv, idx) => idx !== currentIndex ? inv.warehouseId : null)
      .filter(id => id)
    return !selectedWarehouses.includes(warehouse.id)
  })
}
</script>
