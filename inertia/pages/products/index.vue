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
  Trash2,
  Pencil,
  AlertCircle,
  Filter,
  Boxes,
  MinusCircle,
  ChevronDown,
} from 'lucide-vue-next'
import { Head, useForm } from '@inertiajs/vue3'
import { usePage, router } from '@inertiajs/vue3'
import { useToast } from '~/components/ui/toast/use-toast'
import { ref, computed, watch, onMounted } from 'vue'
import { useDebounce } from '@vueuse/core'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Link } from '@inertiajs/vue3'
import axios from 'axios'

const page = usePage()
const products = computed(() => page.props.products?.data || [])
const meta = computed(() => page.props.products?.meta || {
  currentPage: 1,
  perPage: 5,
  total: 0,
  lastPage: 1
})

const { toast } = useToast()

// Estado para el modal de confirmación
const showDeleteModal = ref(false)
const productToDelete = ref(null)

// Estado para el modal de ajuste de inventario
const showAdjustModal = ref(false)
const selectedProduct = ref(null)
const adjustQuantity = ref(0)
const adjustReason = ref('')
const selectedSupplier = ref(null)
const adjustmentReason = ref('')
const transferStatus = ref('pending')
const destinationWarehouse = ref('')  // Agregar estado para el almacén destino

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

// Función para abrir el modal de confirmación
const openDeleteModal = (product) => {
  productToDelete.value = product
  showDeleteModal.value = true
}

// Función para manejar la eliminación
const handleDelete = () => {
  if (!productToDelete.value) return

  router.delete(`/products/${productToDelete.value.id}`, {
    preserveScroll: true,
    onSuccess: () => {
      // Actualizar la lista localmente
      products.value = products.value.filter((p) => p.id !== productToDelete.value.id)

      // Mostrar toast
      toast({
        title: 'Producto eliminado',
        description: `${productToDelete.value.productName} ha sido eliminado exitosamente.`,
        duration: 3000,
      })

      // Cerrar modal y limpiar estado
      showDeleteModal.value = false
      productToDelete.value = null
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar el producto.',
        duration: 3000,
      })
    },
  })
}

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
  destinationWarehouse.value = ''
}

// Función para manejar el ajuste de inventario
const handleAdjust = () => {
  if (!selectedProduct.value || !adjustQuantity.value || !adjustReason.value) return

  const reason = adjustmentReasons.find(r => r.value === adjustReason.value)
  if (!reason) return

  // Para ajustes de suma y transferencia, verificar que la cantidad no sea negativa
  if ((reason.value === 'stock_received' || reason.value === 'transfer') && Number(adjustQuantity.value) < 0) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: '*No se permiten números negativos',
      duration: 3000,
    })
    return
  }

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
        reloadWithFilters()
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
  } else if (reason.value === 'transfer') {
    if (!selectedProduct.value?.id || !adjustQuantity.value || !destinationWarehouse.value) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Faltan datos requeridos para la transferencia',
        duration: 3000,
      })
      return
    }

    const data = {
      productId: selectedProduct.value.id,
      quantity: parseInt(adjustQuantity.value),
      fromWarehouseId: selectedProduct.value.inventory?.warehouseId,
      toWarehouseId: destinationWarehouse.value
    }

    // Validar que los almacenes existen y son diferentes
    if (!data.fromWarehouseId || !data.toWarehouseId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo determinar los almacenes',
        duration: 3000,
      })
      return
    }

    if (data.fromWarehouseId === data.toWarehouseId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'El almacén de origen y destino no pueden ser el mismo',
        duration: 3000,
      })
      return
    }

    router.post('/inventory/transfer', data, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        showAdjustModal.value = false
        reloadWithFilters()
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
        reloadWithFilters()
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
  }
}

// Función para recargar manteniendo los filtros
const reloadWithFilters = () => {
  const params = {}
  if (selectedWarehouse.value) {
    params.warehouse = selectedWarehouse.value
  }
  if (searchQuery.value?.trim()) {
    params.search = searchQuery.value
  }
  
  router.reload({ data: params })
}

// Computed para mostrar/ocultar el selector de tipo de ajuste
const showAdjustTypeSelect = computed(() => {
  const reason = adjustmentReasons.find(r => r.value === adjustReason.value)
  return reason?.type === 'both'
})

// Función para formatear la fecha
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

// Función para calcular las páginas visibles (3 páginas)
const visiblePages = computed(() => {
  const current = meta.value.currentPage
  const last = meta.value.lastPage

  // Si hay menos de 3 páginas, mostrar solo las disponibles
  if (last <= 3) {
    return Array.from({ length: last }, (_, i) => i + 1)
  }

  // Si estamos en las últimas páginas
  if (current >= last - 1) {
    return [last - 2, last - 1, last].filter((page) => page > 0)
  }

  // Si estamos en las primeras páginas
  if (current <= 2) {
    return [1, 2, 3].filter((page) => page <= last)
  }

  // En cualquier otro caso, mostrar la página actual y una página antes y después
  return [current - 1, current, current + 1]
})

const searchQuery = ref('')
const debouncedSearch = useDebounce(searchQuery, 300)

// Observar cambios en la búsqueda debounced
watch(debouncedSearch, (newQuery) => {
  // Mantener el parámetro warehouse cuando se realiza una búsqueda
  const params = { page: 1 }
  
  if (newQuery.trim()) {
    params.search = newQuery
  }
  
  // Incluir el parámetro de almacén si existe
  if (selectedWarehouse.value) {
    params.warehouse = selectedWarehouse.value
  }

  console.log('Realizando búsqueda con parámetros:', params);
  
  router.get('/products', params, {
    preserveState: true,
    preserveScroll: true,
  })
})

// Inicializar searchQuery con el valor de la URL si existe
const initSearch = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const searchParam = urlParams.get('search')
  const warehouseParam = urlParams.get('warehouse')
  
  if (searchParam) {
    searchQuery.value = searchParam
  }
  
  // Si hay un warehouse en la URL, usarlo; de lo contrario, mantener el valor actual
  if (warehouseParam) {
    selectedWarehouse.value = warehouseParam
  }
}

// Llamar a initSearch cuando el componente se monta
onMounted(() => {
  initSearch()
  const urlParams = new URLSearchParams(window.location.search)
  const searchParam = urlParams.get('search')
  const warehouseParam = urlParams.get('warehouse')
  
  if (searchParam) {
    searchQuery.value = searchParam
  }
  if (warehouseParam) {
    selectedWarehouse.value = warehouseParam
  }
  
  // Verificar si hay flash messages al montar el componente
  checkFlashMessages()
})

// Función para manejar flash messages en la carga
const checkFlashMessages = () => {
  console.log("Flash messages en carga:", {
    success: page.props.flash?.success,
    errors: page.props.flash?.errors,
    bulkUploadErrors: page.props.flash?.bulkUploadErrors
  })
  
  // Mostrar mensajes de éxito
  if (page.props.flash?.success) {
    toast({
      title: 'Éxito',
      description: page.props.flash.success,
      duration: 3000,
    })
  }
  
  // Mostrar mensajes de error
  if (page.props.flash?.errors) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: page.props.flash.errors.message || 'Ha ocurrido un error',
      duration: 5000,
    })
  }
  
  // Mostrar errores de carga masiva
  if (page.props.flash?.bulkUploadErrors && page.props.flash?.bulkUploadErrors.length > 0) {
    bulkUploadErrors.value = page.props.flash.bulkUploadErrors
    showBulkUploadErrorsModal.value = true
  }
}

// Verificar que la página solicitada es válida antes de cambiar
const changePage = (newPage) => {
  if (newPage < 1 || newPage > meta.value.lastPage) {
    return
  }

  const params = { page: newPage }
  
  // Incluir el parámetro de búsqueda si existe
  if (searchQuery.value.trim()) {
    params.search = searchQuery.value
  }
  
  // Incluir el parámetro de almacén si existe
  if (selectedWarehouse.value) {
    params.warehouse = selectedWarehouse.value
  }

  // Si vamos a la primera o última página, primero movemos a una página intermedia
  if (
    (newPage === 1 && meta.value.currentPage > 3) ||
    (newPage === meta.value.lastPage && meta.value.currentPage < meta.value.lastPage - 2)
  ) {
    const intermediatePage = newPage === 1 ? 2 : meta.value.lastPage - 1
    router.get(
      '/products',
      { ...params, page: intermediatePage },
      {
        preserveState: true,
        preserveScroll: true,
        onSuccess: () => {
          setTimeout(() => {
            router.get('/products', params, {
              preserveState: true,
              preserveScroll: true,
            })
          }, 200)
        },
      }
    )
    return
  }

  router.get('/products', params, {
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

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(price)
}

const warehouses = computed(() => page.props.warehouses || [])
const selectedWarehouse = ref(page.props.warehouses?.[0]?.id || '')

const showBulkUploadModal = ref(false)
const bulkUploadWarehouse = ref('')
const bulkUploadRequirements = useForm({
  uploadFile: null,
  fileBase64: null,
  fileName: '',
  fileType: '',
  warehouse: null,
})
const downloadTemplate = () => {
  const link = document.createElement('a')
  link.href = '/products/download-template'
  link.download = 'templateBulkUpload.csv' // Nombre que se usará al descargar
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (file) {
    if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      toast({
        variant: 'destructive',
        title: 'Error de formato',
        description: 'Por favor, sube un archivo Excel (.xlsx)',
        duration: 3000,
      })
      // Limpiar el input file
      event.target.value = ''
      return
    }
    
    bulkUploadRequirements.fileName = file.name
    bulkUploadRequirements.fileType = file.type
    
    // Convertir archivo a Base64
    const reader = new FileReader()
    reader.onload = (e) => {
      // Extraer solo la parte de datos del Base64
      const base64String = e.target.result.toString()
      const base64Content = base64String.split(',')[1]
      bulkUploadRequirements.fileBase64 = base64Content
    }
    reader.onerror = () => {
      toast({
        variant: 'destructive',
        title: 'Error de lectura',
        description: 'No se pudo leer el archivo',
        duration: 3000,
      })
    }
    reader.readAsDataURL(file)
  }
}

// Estado para el modal de errores de carga masiva
const showBulkUploadErrorsModal = ref(false)
const bulkUploadErrors = ref([])

// Estado para indicador de carga
const isUploading = ref(false)

// Función para la carga de archivos
const handleBulkUpload = async () => {
  if (!bulkUploadRequirements.fileBase64 || !bulkUploadRequirements.warehouse) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: 'Faltan datos requeridos',
      duration: 3000,
    })
    return
  }

  // Activar indicador de carga
  isUploading.value = true
  
  try {
    // Crear datos para enviar con axios sin cambiar la URL
    const formData = new FormData()
    formData.append('warehouse', bulkUploadRequirements.warehouse)
    formData.append('fileBase64', bulkUploadRequirements.fileBase64)
    formData.append('fileName', bulkUploadRequirements.fileName)
    formData.append('fileType', bulkUploadRequirements.fileType)
    
    // Obtener el token CSRF del meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
    
    // Configurar headers necesarios
    const headers = {
      'Content-Type': 'multipart/form-data',
      'X-CSRF-TOKEN': csrfToken,
      'Accept': 'application/json, text/html' // Preferimos JSON pero aceptamos HTML
    }
    
    // Usar Axios para enviar la solicitud
    const response = await axios.post('/products/bulk-upload', formData, { headers })
    
    // Desactivar indicador de carga
    isUploading.value = false
    
    // Cerrar el modal de carga
    showBulkUploadModal.value = false
    
    // Procesar la respuesta - verificar si es HTML o JSON
    let result
    
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      // La respuesta es HTML, intentar extraer los datos desde data-page
      console.log('Respuesta en formato HTML, extraemos datos...')
      
      const htmlResponse = response.data
      const dataPageMatch = htmlResponse.match(/data-page="(.*?)"/) || 
                            htmlResponse.match(/data-page='(.*?)'/) || 
                            htmlResponse.match(/data-page=({.*})/)
      
      if (dataPageMatch && dataPageMatch[1]) {
        try {
          // Intentar decodificar los datos HTML-encoded
          const decodedData = dataPageMatch[1].replace(/&quot;/g, '"')
                                             .replace(/&lt;/g, '<')
                                             .replace(/&gt;/g, '>')
                                             .replace(/&amp;/g, '&')
                                             
          // Parsear el JSON
          const pageData = JSON.parse(decodedData)
          
          // Extraer el resultado de la carga masiva
          if (pageData.props && pageData.props.bulkUploadResult) {
            result = pageData.props.bulkUploadResult
            console.log('Datos extraídos correctamente:', result)
          } else {
            throw new Error('No se encontró la información de carga masiva en la respuesta')
          }
        } catch (parseError) {
          console.error('Error al parsear datos:', parseError)
          throw new Error('Error al procesar la respuesta del servidor')
        }
      } else {
        // No se pudo encontrar data-page, intentamos buscar directamente el objeto bulkUploadResult
        const bulkResultMatch = htmlResponse.match(/bulkUploadResult&quot;:({.*?})/)
        if (bulkResultMatch && bulkResultMatch[1]) {
          try {
            const decodedData = bulkResultMatch[1].replace(/&quot;/g, '"')
            result = JSON.parse(`{${decodedData}}`)
          } catch (parseError) {
            console.error('Error al parsear datos alternativos:', parseError)
            throw new Error('Error al procesar la respuesta del servidor')
          }
        } else {
          throw new Error('No se pudo extraer la información de la respuesta')
        }
      }
    } else {
      // La respuesta es directamente JSON
      result = response.data
    }
    
    // Mostrar el resultado en consola para depuración
    console.log('Respuesta procesada:', result)
    
    if (result.success) {
      // Mostrar mensaje de éxito
      toast({
        title: 'Éxito',
        description: result.message || 'Carga masiva realizada correctamente',
        duration: 3000,
      })
      
      // Recargar los productos
      reloadWithFilters()
    } else {
      // Verificar cómo vienen los errores en la respuesta
      console.log('Errores recibidos:', result.errors)
      
      // Verificar si hay errores específicos
      if (result.errors && Array.isArray(result.errors) && result.errors.length > 0) {
        // Ya hay un array de errores, lo usamos directamente
        bulkUploadErrors.value = result.errors
        showBulkUploadErrorsModal.value = true
      } else {
        // Si no hay errores específicos, crear uno genérico
        bulkUploadErrors.value = [{
          row: 'N/A',
          product: 'General',
          message: result.message || 'Error al procesar el archivo Excel'
        }]
        showBulkUploadErrorsModal.value = true
      }
    }
    
    // Limpiar el formulario después de procesar
    bulkUploadRequirements.reset()
    const fileInput = document.querySelector('input[type="file"]')
    if (fileInput) fileInput.value = ''
    
  } catch (error) {
    console.error('Error en carga masiva:', error)
    isUploading.value = false
    showBulkUploadModal.value = false
    
    // Intentar extraer mensajes de error de la respuesta HTML si existe
    if (error.response?.data && typeof error.response.data === 'string' && 
        error.response.data.includes('<!DOCTYPE html>')) {
      
      const htmlResponse = error.response.data
      try {
        // Buscar data-page en el HTML
        const match = htmlResponse.match(/data-page="(.*?)"/) || 
                      htmlResponse.match(/data-page='{(.*?)}'/) ||
                      htmlResponse.match(/data-page=({.*})/)
        
        if (match && match[1]) {
          // Decodificar entidades HTML
          const decodedData = match[1].replace(/&quot;/g, '"')
                                    .replace(/&lt;/g, '<')
                                    .replace(/&gt;/g, '>')
                                    .replace(/&amp;/g, '&')
          
          // Intentar parsear el JSON
          try {
            const pageData = JSON.parse(decodedData)
            
            // Extraer errores si existen
            if (pageData.props?.bulkUploadResult?.errors) {
              bulkUploadErrors.value = pageData.props.bulkUploadResult.errors
              showBulkUploadErrorsModal.value = true
              
              // Limpiar el formulario
              bulkUploadRequirements.reset()
              const fileInput = document.querySelector('input[type="file"]')
              if (fileInput) fileInput.value = ''
              return
            }
          } catch (parseError) {
            console.error('Error al parsear data-page:', parseError)
          }
        }
      } catch (extractError) {
        console.error('Error al extraer datos del HTML:', extractError)
      }
    }
    
    // Si no se pudo extraer información específica, mostrar error genérico
    bulkUploadErrors.value = [{
      row: 'N/A',
      product: 'Error de conexión',
      message: error.message || 'Ha ocurrido un error al intentar comunicarse con el servidor.'
    }]
    
    // Mostrar el modal con los errores
    showBulkUploadErrorsModal.value = true
    
    // Limpiar el formulario
    bulkUploadRequirements.reset()
    const fileInput = document.querySelector('input[type="file"]')
    if (fileInput) fileInput.value = ''
  }
  
  // Establecer un timeout como medida de seguridad
  setTimeout(() => {
    if (isUploading.value) {
      isUploading.value = false
      showBulkUploadModal.value = false
      
      // Mostrar modal con error de timeout
      bulkUploadErrors.value = [{
        row: 'N/A',
        product: 'Error de servidor',
        message: 'No se recibió respuesta del servidor en el tiempo esperado. Intente nuevamente.'
      }]
      showBulkUploadErrorsModal.value = true
      
      // Limpiar el formulario
      bulkUploadRequirements.reset()
      const fileInput = document.querySelector('input[type="file"]')
      if (fileInput) fileInput.value = ''
    }
  }, 30000) // 30 segundos de timeout
}

// Modificar el watch para warehouses para garantizar que siempre se seleccione el primer almacén por defecto
watch(warehouses, (newWarehouses) => {
  if (newWarehouses?.length > 0) {
    // Siempre seleccionar el primer almacén si no hay ninguno seleccionado o el seleccionado no existe
    const warehouseExists = newWarehouses.some(w => w.id === selectedWarehouse.value);
    if (!selectedWarehouse.value || !warehouseExists) {
      console.log('Seleccionando primer almacén por defecto:', newWarehouses[0].name);
      selectedWarehouse.value = newWarehouses[0].id;
      
      // Actualizar la URL con el almacén seleccionado
      const params = { warehouse: newWarehouses[0].id };
      if (searchQuery.value.trim()) {
        params.search = searchQuery.value;
      }
      router.get('/products', params, {
        preserveState: true,
        preserveScroll: true,
      });
    }
  }
}, { immediate: true })

// Modificar el computed de products para incluir el filtro por almacén y manejar caso undefined
const filteredProducts = computed(() => {
  // Manejar caso donde products o products.data podrían ser undefined
  return page.props.products?.data || []
})

// Agregar watch para el cambio de almacén
watch(selectedWarehouse, (newWarehouseId) => {
  // Actualizar la URL con el nuevo filtro de almacén
  const params = { page: 1 } // Siempre volver a la primera página al cambiar el filtro
  
  if (searchQuery.value.trim()) {
    params.search = searchQuery.value
  }
  
  if (newWarehouseId) {
    params.warehouse = newWarehouseId
  }

  router.get('/products', params, {
    preserveState: true,
    preserveScroll: true,
  })
})

// Agregar propiedad computada para calcular el nuevo stock
const newStockInfo = computed(() => {
  if (
    adjustReason.value === 'stock_received' &&
    selectedProduct.value &&
    selectedProduct.value.inventory &&
    typeof selectedProduct.value.inventory.stock === 'number'
  ) {
    const currentStock = Number(selectedProduct.value.inventory.stock) || 0
    const received = Number(adjustQuantity.value) || 0
    const total = currentStock + received
    return `${currentStock} + ${received} = ${total}`
  }
  return ''
})

// Agregar propiedad computada para calcular el nuevo stock para daño, robo, merma y pérdida
const newStockInfoSub = computed(() => {
  const deductionTypes = ['damage', 'theft', 'shrinkage', 'loss']
  if (
    deductionTypes.includes(adjustReason.value) &&
    selectedProduct.value &&
    selectedProduct.value.inventory &&
    typeof selectedProduct.value.inventory.stock === 'number'
  ) {
    const currentStock = Number(selectedProduct.value.inventory.stock) || 0
    const lost = Number(adjustQuantity.value) || 0
    const total = currentStock - lost
    return `${currentStock} - ${lost} = ${total}`
  }
  return ''
})

// Agregar propiedad computada para calcular el nuevo stock para corrección
const newStockInfoCorrection = computed(() => {
  if (
    adjustReason.value === 'correction' &&
    selectedProduct.value &&
    selectedProduct.value.inventory &&
    typeof selectedProduct.value.inventory.stock === 'number'
  ) {
    const currentStock = Number(selectedProduct.value.inventory.stock) || 0
    const correctionAmt = Number(adjustQuantity.value) || 0
    const total = currentStock + correctionAmt
    return correctionAmt < 0
      ? `${currentStock} - ${Math.abs(correctionAmt)} = ${total}`
      : `${currentStock} + ${correctionAmt} = ${total}`
  }
  return ''
})

// Agregar propiedad computada para validar la cantidad ingresada
const deductionError = computed(() => {
  const currentStock = Number(selectedProduct.value?.inventory?.stock) || 0
  const qty = Number(adjustQuantity.value)
  if (qty < 0) {
    return "*No se permiten números negativos"
  }
  // Para tipos de ajuste de sustracción, validar que no supere el stock
  if (['damage', 'theft', 'shrinkage', 'loss'].includes(adjustReason.value) && qty > currentStock) {
    return "*La cantidad a sustraer no puede superar las existencias"
  }
  return ""
})

// Agregar propiedad computada para validar que el nuevo stock en corrección no sea negativo
const correctionError = computed(() => {
  if (
    adjustReason.value === 'correction' &&
    selectedProduct.value &&
    selectedProduct.value.inventory &&
    typeof selectedProduct.value.inventory.stock === 'number'
  ) {
    const currentStock = Number(selectedProduct.value.inventory.stock) || 0
    const correction = Number(adjustQuantity.value) || 0
    const newStock = currentStock + correction
    if (newStock < 0) {
      return "*El nuevo stock no puede ser negativo"
    }
  }
  return ""
})
</script>

<template>

  <Head title="Products" />

  <!-- Vista para cuando no hay almacenes registrados -->
  <div v-if="!warehouses.length" class="container flex flex-col items-center justify-center min-h-[88vh] p-6">
    <div class="bg-gray-50 rounded-full p-2 mb-2">
      <Package class="h-16 w-16 text-blue-400" />
    </div>
    <h2 class="text-2xl font-semibold text-gray-800 mb-3">No hay almacenes registrados</h2>
    <p class="text-gray-500 max-w-lg mb-8 text-center">Necesitas crear al menos un almacén para poder gestionar productos.</p>
    <Link href="/warehouses/create">
    <Button class="bg-blue-700 hover:bg-blue-800">
      <Plus class="w-4 h-4 mr-2" />
      Crear almacén
    </Button>
    </Link>
  </div>

  <!-- Contenido normal cuando hay almacenes -->
  <div v-else class="container space-y-2 px-2 py-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <Package class="h-6 w-6 text-blue-800" />
        <h2 class="text-2xl font-bold tracking-tight">Productos</h2>
        <span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-sm text-blue-800">
          {{ filteredProducts.length }} {{ filteredProducts.length === 1 ? 'producto' : 'productos' }}
        </span>
      </div>
      <div class="flex items-center space-x-2">
        <Button class="bg-blue-700 hover:bg-blue-800" @click="showBulkUploadModal = true" type="button">
          <Plus class="w-4 h-4 mr-2" />
          Carga masiva de productos
        </Button>
        <Link href="/products/create">
        <Button class="bg-blue-700 hover:bg-blue-800">
          <PlusCircle class="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
        </Link>
      </div>
    </div>

    <!-- Filtros y selector de almacén fuera de la tabla -->
    <Card class="mb-4 p-4 bg-gray-50">
      <div class="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div class="relative w-full sm:w-64">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input v-model="searchQuery" class="pl-9 bg-white w-full" placeholder="Buscar productos..." type="search" @input="e => searchQuery = e.target.value" />
        </div>
        <div class="flex space-x-2 items-center w-full sm:w-auto">
          <Filter class="h-4 w-4 text-gray-500" />
          <!-- Reemplazar el componente Select con un select personalizado -->
          <div class="relative w-full sm:w-[200px]">
            <select v-model="selectedWarehouse" class="h-10 w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-md bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id">
                {{ warehouse.name }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown class="h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>
      </div>
    </Card>

    <!-- Vista para cuando el almacén seleccionado no tiene productos -->
    <div v-if="filteredProducts.length === 0 && selectedWarehouse" class="flex flex-col items-center justify-center min-h-[400px] p-6 bg-white rounded-lg shadow-sm">
      <div class="bg-gray-50 rounded-full p-2 mb-2">
        <Package class="h-12 w-12 text-blue-400" />
      </div>
      <h2 class="text-xl font-semibold text-gray-800 mb-3">No hay productos en inventario</h2>
      <p class="text-gray-500 max-w-lg mb-6 text-center">El almacén seleccionado no posee productos en inventario.</p>
      <div class="flex gap-4">
        <Link href="/products/create">
        <Button class="bg-blue-700 hover:bg-blue-800">
          <PlusCircle class="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
        </Link>
      </div>
    </div>

    <!-- Tabla de productos -->
    <Card v-else class="flex flex-col min-h-[65vh]">
      <CardContent class="p-0 flex-1 overflow-auto">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader class="bg-gray-50 hover:bg-gray-50">
              <TableRow>
                <TableHead class="hidden w-[100px] sm:table-cell font-semibold">Imagen</TableHead>
                <TableHead class="font-semibold">Nombre</TableHead>
                <TableHead class="hidden sm:table-cell font-semibold">Categoría</TableHead>
                <TableHead class="hidden sm:table-cell font-semibold">Precio</TableHead>
                <TableHead class="hidden sm:table-cell font-semibold">Stock</TableHead>
                <TableHead class="hidden sm:table-cell font-semibold">Estado</TableHead>
                <TableHead class="hidden sm:table-cell font-semibold">Almacén</TableHead>
                <TableHead class="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="filteredProducts.length === 0">
                <TableCell colspan="8" class="h-40 text-center text-gray-500">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <Package class="h-8 w-8 text-gray-400" />
                    <p>No se encontraron productos con los filtros actuales</p>
                    <Button variant="outline" size="sm" @click="searchQuery = ''; selectedWarehouse = ''" class="mt-2">
                      Limpiar filtros
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              <TableRow v-for="product in filteredProducts" :key="product.id" class="border-b transition-colors hover:bg-blue-50/30">
                <TableCell class="hidden sm:table-cell">
                  <img alt="Product image" class="aspect-square rounded-md object-cover" height="64" :src="`/inertia/public/products/${product.imagePath}`" width="64" />
                </TableCell>
                <TableCell class="font-medium">{{ product.productName }}</TableCell>
                <TableCell class="hidden sm:table-cell">
                  {{ product.category?.categoryName }}
                </TableCell>
                <TableCell class="hidden sm:table-cell">
                  {{ formatPrice(product.price) }}
                </TableCell>
                <TableCell class="hidden sm:table-cell">{{ product.inventory?.stock || 'N/A' }}</TableCell>
                <TableCell class="hidden sm:table-cell">
                  <Badge :class="{
                    'bg-blue-100 text-blue-800': product.inventory?.stockStatus === 'available',
                    'bg-amber-100 text-amber-800': product.inventory?.stockStatus === 'low',
                    'bg-rose-100 text-rose-800': product.inventory?.stockStatus === 'out_of_stock' || !product.inventory
                  }">
                    {{ getStockStatus(product.inventory?.stockStatus || 'out_of_stock').label }}
                  </Badge>
                </TableCell>
                <TableCell class="hidden sm:table-cell">
                  {{ product.inventory?.warehouse?.name || 'Sin almacén' }}
                </TableCell>
                <TableCell>
                  <div class="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600" @click="openDeleteModal(product)" title="Eliminar producto">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full hover:bg-blue-100 hover:text-blue-600" @click="router.get(`/products/${product.id}/edit`, { warehouse: selectedWarehouse })" title="Editar producto">
                      <Pencil class="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" @click="openAdjustModal(product)" :disabled="!product.inventory?.warehouse" :class="{ 'opacity-50 cursor-not-allowed': !product.inventory?.warehouse }" :title="product.inventory?.warehouse ? 'Ajustar inventario' : 'Producto sin almacén asignado'">
                      <Boxes class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter class="mt-auto bg-gray-50 border-t px-6 py-4 flex justify-between items-center">
        <p class="text-sm text-muted-foreground">
          Mostrando {{ (meta.currentPage - 1) * meta.perPage + 1 }} a
          {{ Math.min(meta.currentPage * meta.perPage, meta.total) }} de
          {{ meta.total }} productos
        </p>
        <div class="flex items-center gap-0.5">
          <div class="flex gap-0.5">
            <Button variant="outline" :disabled="meta.currentPage === 1" @click="changePage(1)" class="px-2 h-10">
              <ChevronsLeft class="h-4 w-4" />
            </Button>
            <Button variant="outline" :disabled="meta.currentPage === 1" @click="changePage(meta.currentPage - 1)" class="px-2 h-10">
              <ChevronLeft class="h-4 w-4" />
            </Button>
          </div>
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
          ¿Estás seguro de que deseas eliminar el producto "{{ productToDelete?.productName }}"?
          Esta acción no se puede deshacer.
        </DialogDescription>
      </DialogHeader>
      <div v-if="productToDelete" class="my-4 rounded-lg bg-gray-50 p-4">
        <div class="flex items-center gap-3">
          <img :src="`/inertia/public/products/${productToDelete.imagePath}`" class="h-12 w-12 rounded-lg object-cover" alt="Product image" />
          <div>
            <p class="font-medium">{{ productToDelete.productName }}</p>
            <p class="text-sm text-gray-500">{{ formatPrice(productToDelete.price) }}</p>
          </div>
        </div>
      </div>
      <DialogFooter class="flex justify-end gap-2">
        <Button type="button" variant="outline" @click="showDeleteModal = false">
          Cancelar
        </Button>
        <Button @click="handleDelete" variant="destructive" class="bg-red-600 hover:bg-red-700">
          Eliminar producto
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Modal de ajuste de inventario -->
  <Dialog :open="showAdjustModal" @update:open="(value) => {
    showAdjustModal = value
    if (!value) {
      // Limpiar el estado cuando se cierra el modal
      selectedProduct.value = null
      adjustQuantity.value = 0
      adjustReason.value = ''
      selectedSupplier.value = null
      adjustmentReason.value = ''
      transferStatus.value = 'pending'
      destinationWarehouse.value = ''
    }
  }">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Ajustar Inventario</DialogTitle>
        <DialogDescription>
          Ajusta el inventario del producto {{ selectedProduct?.productName }}
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="space-y-4">
          <!-- Tipo de ajuste -->
          <div class="space-y-2">
            <Label>Tipo de Ajuste</Label>
            <Select v-model="adjustReason">
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de ajuste" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Tipos de Ajuste</SelectLabel>
                  <SelectItem v-for="reason in adjustmentReasons" :key="reason.value" :value="reason.value">
                    {{ reason.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <!-- Cantidad -->
          <div class="space-y-2">
            <Label>Cantidad</Label>
            <Input type="number" v-model="adjustQuantity" placeholder="Ingresa la cantidad" />
          </div>

          <!-- Mostrar mensaje de error debajo del formulario de cantidad para sustracciones -->
          <div v-if="['damage', 'theft', 'shrinkage', 'loss', 'stock_received', 'transfer'].includes(adjustReason) && deductionError" class="text-red-600 text-sm">
            {{ deductionError }}
          </div>

          <!-- Nuevo campo para mostrar Nuevos stock solo para stock_received -->
          <div v-if="adjustReason === 'stock_received'" class="space-y-2">
            <Label>Nuevos stock</Label>
            <div class="p-2 border rounded bg-gray-100">
              {{ newStockInfo }}
            </div>
          </div>

          <!-- Nuevo campo para mostrar Nuevo stock en daño, robo, merma y pérdida -->
          <div v-if="['damage', 'theft', 'shrinkage', 'loss'].includes(adjustReason)" class="space-y-2">
            <Label>Nuevo stock</Label>
            <div class="p-2 border rounded bg-gray-100">
              {{ newStockInfoSub }}
            </div>
          </div>

          <!-- Nuevo campo para mostrar Nuevo stock en corrección -->
          <div v-if="adjustReason === 'correction'" class="space-y-2">
            <Label>Nuevo stock</Label>
            <div class="p-2 border rounded bg-gray-100">
              {{ newStockInfoCorrection }}
            </div>
            <div v-if="correctionError" class="text-red-600 text-sm">
              {{ correctionError }}
            </div>
          </div>

          <!-- Almacén destino (solo para transferencias) -->
          <div v-if="adjustReason === 'transfer'" class="space-y-2">
            <Label>Almacén Destino</Label>
            <Select v-model="destinationWarehouse">
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el almacén destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Almacenes</SelectLabel>
                  <SelectItem v-for="warehouse in warehouses" :key="warehouse.id" :value="warehouse.id" :disabled="warehouse.id === selectedProduct?.inventory?.warehouseId">
                    {{ warehouse.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <!-- Razón del ajuste (para ajustes que requieren razón) -->
          <div v-if="adjustmentReasons.find(r => r.value === adjustReason)?.requiresReason" class="space-y-2">
            <Label>Razón del Ajuste</Label>
            <Textarea v-model="adjustmentReason" placeholder="Ingresa la razón del ajuste" />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="showAdjustModal = false">Cancelar</Button>
        <Button @click="handleAdjust">Confirmar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <!-- Modal de carga masiva de productos -->
  <Dialog :open="showBulkUploadModal" @update:open="(value) => {
    showBulkUploadModal = value
    if (!value) {
      // Reiniciar el formulario cuando se cierra el modal
      bulkUploadRequirements.reset()
    }
  }">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Carga masiva de productos</DialogTitle>
        <DialogDescription>
          Descarga la plantilla, completa los datos y sube el archivo para cargar múltiples productos a la vez.
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="flex items-center gap-2 bg-blue-50 p-3 rounded-md">
          <File class="h-5 w-5 text-blue-600" />
          <span class="text-sm text-blue-600">Descarga la plantilla y completa los datos de tus productos</span>
        </div>

        <Button variant="outline" class="w-full" @click="downloadTemplate">
          <File class="h-4 w-4 mr-2" />
          Descargar plantilla Excel
        </Button>

        <div class="space-y-2">
          <Label>Almacén destino</Label>
          <Select v-model="bulkUploadRequirements.warehouse" required>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona el almacén" />
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

        <div class="space-y-2">
          <Label>Archivo Excel (.xlsx)</Label>
          <div class="flex items-center gap-2">
            <Input type="file" ref="fileInput" accept=".xlsx" @change="handleFileChange" class="flex-1" />
          </div>
        </div>

        <div v-if="bulkUploadRequirements.fileName" class="p-3 bg-gray-50 rounded-md flex items-center justify-between">
          <div class="flex items-center gap-2">
            <File class="h-4 w-4 text-gray-500" />
            <span class="text-sm font-medium">{{ bulkUploadRequirements.fileName }}</span>
          </div>
          <Button variant="ghost" size="sm" @click="bulkUploadRequirements.fileName = ''; bulkUploadRequirements.fileBase64 = null">
            <MinusCircle class="h-4 w-4" />
          </Button>
        </div>
      </div>
      <DialogFooter class="flex justify-between gap-2">
        <Button variant="outline" @click="showBulkUploadModal = false">Cancelar</Button>
        <Button @click="handleBulkUpload" :disabled="!bulkUploadRequirements.fileBase64 || !bulkUploadRequirements.warehouse || isUploading" class="bg-blue-700 hover:bg-blue-800">
          <template v-if="isUploading">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Procesando...
          </template>
          <template v-else>
            <PlusCircle class="h-4 w-4 mr-2" />
            Cargar productos
          </template>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <!-- Modal de errores de carga masiva -->
  <Dialog :open="showBulkUploadErrorsModal" @update:open="showBulkUploadErrorsModal = false">
    <DialogContent class="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader class="shrink-0">
        <DialogTitle class="text-red-600 flex items-center gap-2">
          <AlertCircle class="h-5 w-5" />
          Errores en la carga masiva de productos
        </DialogTitle>
        <DialogDescription>
          Se encontraron los siguientes errores al procesar el archivo. Por favor, corrígelos e intenta nuevamente.
        </DialogDescription>
      </DialogHeader>
      <div class="py-2 flex-1 overflow-hidden flex flex-col">
        <div class="overflow-y-auto max-h-[300px]">
          <Table>
            <TableHeader class="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead class="w-[80px]">Fila</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="bulkUploadErrors.length === 0">
                <TableCell colspan="3" class="text-center py-4 text-gray-500">
                  Error general al procesar el archivo
                </TableCell>
              </TableRow>
              <TableRow v-for="(error, index) in bulkUploadErrors" :key="index" class="border-b">
                <TableCell class="font-medium">{{ error.row || 'N/A' }}</TableCell>
                <TableCell>{{ error.product || 'N/A' }}</TableCell>
                <TableCell class="text-red-600">{{ error.message }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md shrink-0">
          <h3 class="text-sm font-semibold text-amber-800 mb-1">Recomendaciones:</h3>
          <ul class="text-sm text-amber-700 space-y-1 list-disc pl-5">
            <li>Verifica que todos los campos obligatorios estén completos.</li>
            <li>Asegúrate de que los precios y cantidades sean valores numéricos válidos.</li>
            <li>Comprueba que las categorías existan en el sistema.</li>
            <li>Revisa el formato de los datos según la plantilla proporcionada.</li>
          </ul>
        </div>
      </div>
      <DialogFooter class="flex justify-between gap-2 shrink-0 mt-2">
        <Button variant="outline" @click="showBulkUploadModal = true; showBulkUploadErrorsModal = false">
          Volver a la carga masiva
        </Button>
        <Button @click="showBulkUploadErrorsModal = false" class="bg-red-600 hover:bg-red-700">
          Cerrar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style>
:deep(.badge-success) {
  background-color: #1d4ed8; /* blue-700 - matching the Add Product button */
  color: white;
}

:deep(.badge-warning) {
  background-color: #f59e0b; /* amber-500 */
  color: white;
}

:deep(.badge-destructive) {
  background-color: #e11d48; /* rose-600 */
  color: white;
}

:deep(.badge-info) {
  background-color: #1d4ed8; /* blue-700 */
  color: white;
}
</style>
