<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { router, usePage } from '@inertiajs/vue3'
import { ImagePlus, Plus } from 'lucide-vue-next'
import { useToast } from '~/components/ui/toast/use-toast'

const page = usePage()
const product = page.props.product
const categories = computed(() => page.props.categories)
const warehouses = computed(() => page.props.warehouses)
const units = computed(() => page.props.units || {})
const { toast } = useToast()

// Estado del formulario
const form = reactive({
  name: product.productName,
  price: product.price,
  initialStock: product.initialStock,
  criticalStock: product.criticalStock,
  sku: product.sku,
  description: product.description,
  category: product.categoryId,
  image: null,
  warehouseId: product.warehouseId,
  unitId: String(product.unitId || ''),
  precision: String(product.precision || '1'),
  hasInventory: product.hasInventory,
})

const categoryForm = reactive({
  name: '',
})

// Estado para la imagen
const fileInput = ref(null)
const previewImage = ref(`/inertia/public/products/${product.imagePath}`)
const isDragging = ref(false)

// Estado para el modal y loading
const showcategoryFormModal = ref(false)
const isCreatingCategory = ref(false)
const isSubmitting = ref(false)

// Computed para la unidad seleccionada
const selectedUnit = computed(() => {
  if (!form.unitId) return null
  return Object.values(units.value)
    .flat()
    .find(unit => String(unit.id) === form.unitId)
})

// Computed para determinar si se puede editar la precisión
const canEditPrecision = computed(() => {
  if (!selectedUnit.value) return true
  return selectedUnit.value.name !== 'Cada uno'
})

// Función para formatear la precisión
const formatPrecision = (precision) => {
  const num = Number(precision)
  return num.toLocaleString('es-CL')
}

// Watch para actualizar la precisión cuando cambia la unidad
watch(() => form.unitId, (newUnitId) => {
  const unit = Object.values(units.value)
    .flat()
    .find(unit => String(unit.id) === newUnitId)
  
  if (unit) {
    // Si la unidad es "Cada uno", forzar la precisión a 1
    if (unit.name === 'Cada uno') {
      form.precision = '1'
    } else {
      // Si no es "Cada uno", usar la precisión de la unidad
      form.precision = String(unit.precision)
    }
  }
})

// Watch para validar la precisión cuando cambia
watch(() => form.precision, (newPrecision) => {
  if (!selectedUnit.value) return
  
  // Si la unidad es "Cada uno", forzar la precisión a 1
  if (selectedUnit.value.name === 'Cada uno') {
    form.precision = '1'
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
  isSubmitting.value = true
  
  // Crear FormData para manejar la imagen
  const formData = new FormData()
  formData.append('name', form.name)
  formData.append('price', form.price)
  formData.append('category', form.category === 'null' ? null : form.category)
  formData.append('description', form.description)
  formData.append('sku', form.sku === 'null' ? null : form.sku)
  formData.append('initialStock', form.initialStock)
  formData.append('criticalStock', form.criticalStock)
  formData.append('unitId', form.unitId || '')
  formData.append('precision', form.precision || '1')
  formData.append('hasInventory', form.hasInventory)
  
  // Solo agregar la imagen si se seleccionó una nueva
  if (form.image) {
    formData.append('image', form.image)
  }

  // Mantener el warehouseId en la URL al enviar el formulario
  router.put(`/products/${product.id}?warehouse=${form.warehouseId}`, formData, {
    forceFormData: true,
    onSuccess: () => {
      toast({
        title: 'Producto actualizado',
        description: 'Los cambios han sido guardados exitosamente.',
        duration: 3000
      })
      // Redirigir manteniendo el filtro de almacén y página 1
      router.visit(`/products?page=1&warehouse=${form.warehouseId}`)
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron guardar los cambios.',
        duration: 3000
      })
    },
    onFinish: () => {
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
      duration: 3000
    })
    return
  }

  isCreatingCategory.value = true
  router.post('/categories', categoryForm, {
    preserveScroll: true,
    onSuccess: (response) => {
      isCreatingCategory.value = false
      showcategoryFormModal.value = false
      
      const newCategory = response.props.flash.categoryId
      if (newCategory) {
        form.category = newCategory
      }

      toast({
        title: 'Categoría creada',
        description: `La categoría "${categoryForm.name}" ha sido creada exitosamente.`,
        duration: 3000
      })

      categoryForm.name = ''
    },
    onError: (errors) => {
      isCreatingCategory.value = false
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errors.message || 'Error al crear la categoría.',
        duration: 3000
      })
    }
  })
}
</script>

<template>
  <div>
    <div class="max-w-7xl mx-auto p-6 space-y-8 bg-background rounded-lg">
      <!-- Título principal -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold">Editar Producto</h2>
          <p class="text-muted-foreground">Modifica los detalles del producto</p>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Detalles del producto -->
        <Card class="p-6 space-y-4">
          <h3 class="text-xl font-semibold">Detalles del producto</h3>
          <div class="grid grid-cols-5 gap-4">
            <!-- Primera columna: Detalles del producto -->
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

            <!-- Segunda columna: Imagen del producto -->
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
              <div :class="{ 'opacity-50 pointer-events-none': form.hasInventory }">
                <Select 
                  v-model="form.unitId"
                  :disabled="form.hasInventory"
                >
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
              <p v-if="form.hasInventory" class="text-sm text-muted-foreground">
                No se puede cambiar la unidad de medida para productos con inventario
              </p>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Precisión</label>
              <Select 
                v-model="form.precision" 
                :disabled="!canEditPrecision || form.hasInventory"
                :class="{ 'opacity-50': form.hasInventory || !canEditPrecision }"
              >
                <SelectTrigger class="w-full" :class="{ 'opacity-50': form.hasInventory || !canEditPrecision }">
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
              <p v-if="form.hasInventory" class="text-sm text-muted-foreground">
                No se puede cambiar la precisión para productos con inventario
              </p>
              <p v-else-if="!canEditPrecision" class="text-sm text-muted-foreground">
                La precisión no se puede modificar para la unidad "Cada uno"
              </p>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Stock inicial</label>
              <Input 
                v-model="form.initialStock" 
                type="number" 
                placeholder="0" 
                :disabled="true"
                class="opacity-50"
              />
              <p class="text-sm text-muted-foreground">
                {{ form.hasInventory 
                  ? 'El stock inicial no se puede modificar una vez creado el producto' 
                  : 'Este producto no tiene control de inventario' 
                }}
              </p>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Stock crítico</label>
              <Input 
                v-model="form.criticalStock" 
                type="number" 
                placeholder="0" 
                :disabled="!form.hasInventory"
                :class="{ 'opacity-50': !form.hasInventory }"
              />
              <p v-if="!form.hasInventory" class="text-sm text-muted-foreground">
                Este producto no tiene control de inventario
              </p>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Almacén</label>
              <Select v-model="form.warehouseId" disabled>
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Seleccionar almacén" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Almacenes</SelectLabel>
                    <SelectItem v-for="warehouse in warehouses" :key="warehouse.id" :value="String(warehouse.id)">
                      {{ warehouse.name }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <!-- Botones de acción -->
        <div class="flex justify-end gap-4">
          <Button type="button" variant="outline">
            <Link :href="`/products?page=1&warehouse=${form.warehouseId}`">Cancelar</Link>
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Guardando...' : 'Guardar cambios' }}
          </Button>
        </div>
      </form>

      <!-- Modal para nueva categoría -->
      <Dialog :open="showcategoryFormModal" @update:open="showcategoryFormModal = false">
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva categoría</DialogTitle>
            <DialogDescription>Añade una nueva categoría para tus productos</DialogDescription>
          </DialogHeader>
          <form @submit.prevent="createCategory">
            <div class="space-y-4 py-4">
              <div>
                <label class="text-sm font-medium">Nombre de la categoría</label>
                <Input v-model="categoryForm.name" placeholder="Ej: Bebidas calientes" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" @click="showcategoryFormModal = false">
                Cancelar
              </Button>
              <Button type="button" @click="createCategory" :disabled="isCreatingCategory">
                {{ isCreatingCategory ? 'Creando...' : 'Crear categoría' }}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>