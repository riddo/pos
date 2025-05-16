<script setup>
import { ref } from 'vue'
import { Head, router, usePage } from '@inertiajs/vue3'
import DashboardLayout from '~/pages/layouts/DashboardLayout.vue'
import { Store } from 'lucide-vue-next'
import { useToast } from '~/components/ui/toast/use-toast'

const page = usePage()
const warehouse = page.props.warehouse
const { toast } = useToast()

const form = ref({
  name: warehouse.name,
  location: warehouse.location,
  warehouseType: warehouse.warehouseType,
  status: warehouse.status
})

const handleSubmit = () => {
  router.put(`/warehouses/${warehouse.id}`, form.value, {
    onSuccess: () => {
      toast({
        title: 'Almacén actualizado',
        description: 'El almacén ha sido actualizado exitosamente.',
        duration: 3000,
      })
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo actualizar el almacén.',
        duration: 3000,
      })
    },
  })
}
</script>

<template>
  <Head title="Editar Almacén" />
      <Card>
        <CardHeader>
          <CardTitle>Editar Almacén</CardTitle>
          <CardDescription>
            Modifica los datos del almacén
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

            <div class="flex justify-end gap-4 pt-4">
              <Button variant="outline" type="button" @click="router.get('/warehouses')">
                Cancelar
              </Button>
              <Button type="submit">Guardar Cambios</Button>
            </div>
          </form>
        </CardContent>
      </Card>
</template> 