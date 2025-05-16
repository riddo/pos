<script setup>
import { ref } from 'vue'
import { Head, router } from '@inertiajs/vue3'
import DashboardLayout from '~/pages/layouts/DashboardLayout.vue'
import { Store, AlertTriangle } from 'lucide-vue-next'
import { useToast } from '~/components/ui/toast/use-toast'

const { toast } = useToast()
const form = ref({
  name: '',
  location: '',
  warehouseType: 'warehouse',
  status: 'active'
})

// Estado para la confirmación
const confirmCreation = ref(false)

const handleSubmit = () => {
  // Verificar que la checkbox esté marcada
  if (!confirmCreation.value) {
    toast({
      variant: 'destructive',
      title: 'Confirmación requerida',
      description: 'Debe confirmar que entiende la política de almacenes antes de crear uno nuevo.',
      duration: 3000,
    })
    return
  }

  router.post('/warehouses', form.value, {
    onSuccess: () => {
      toast({
        title: 'Almacén creado',
        description: 'El almacén ha sido creado exitosamente.',
        duration: 3000,
      })
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el almacén.',
        duration: 3000,
      })
    },
  })
}
</script>

<template>
  <Head title="Crear Almacén" />
      <Card>
        <CardHeader>
          <CardTitle>Crear Almacén</CardTitle>
          <CardDescription>
            Añade un nuevo almacén o tienda al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div class="space-y-2">
              <Label for="name">Nombre</Label>
              <Input id="name" v-model="form.name" required />
            </div>

            <div class="space-y-2">
              <Label for="location">Ubicación</Label>
              <Input id="location" v-model="form.location" />
            </div>

            <div class="space-y-2">
              <Label for="type">Tipo</Label>
              <Select v-model="form.warehouseType">
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store">Tienda</SelectItem>
                  <SelectItem value="warehouse">Bodega</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="status">Estado</Label>
              <Select v-model="form.status">
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Checkbox de confirmación con mensaje de advertencia -->
            <div class="border border-amber-200 bg-amber-50 rounded-md p-4 mt-6">
              <div class="flex gap-2 items-start">
                <AlertTriangle class="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h3 class="font-medium text-amber-800 mb-2">Importante</h3>
                  <p class="text-sm text-amber-700 mb-3">
                    Una vez creado el almacén, este NO SE ELIMINA y solo se podrá Inactivar en caso de que lo requiera.
                  </p>
                  <div class="flex items-center space-x-2">
                    <Checkbox id="confirm" v-model:checked="confirmCreation" />
                    <label for="confirm" class="text-sm font-medium text-amber-800 leading-none cursor-pointer">
                      Comprendo y acepto esta condición
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-4 pt-4">
              <Button variant="outline" type="button" @click="router.get('/warehouses')">
                Cancelar
              </Button>
              <Button type="submit" :disabled="!confirmCreation">Crear Almacén</Button>
            </div>
          </form>
        </CardContent>
      </Card>
</template>