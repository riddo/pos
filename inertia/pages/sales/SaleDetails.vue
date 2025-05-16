<script setup>
import { Head, router } from '@inertiajs/vue3'
import { ArrowLeft } from 'lucide-vue-next'

const props = defineProps({
  sale: {
    type: Object,
    required: true,
  },
})

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

const formatQuantity = (quantity) => {
  // Convertir a número y eliminar ceros a la derecha manteniendo decimales significativos
  return Number(quantity).toString()
}

const formatPrice = (price) => {
  // Asegurarse de que price sea un número
  const numericPrice = Number(price)
  if (isNaN(numericPrice)) {
    console.warn('Invalid price value:', price)
    return '$ 0'
  }
  return numericPrice.toLocaleString('es-CL', {
    style: 'currency',
    currency: 'CLP',
  })
}

const getPaymentMethodName = (method) => {
  const methods = {
    cash: 'Efectivo',
    debit: 'Débito',
    credit: 'Crédito',
  }
  return methods[method] || method
}
</script>

<template>

  <Head :title="`Venta #${sale.id}`" />
  <div class="space-y-3">
    <!-- Encabezado -->
    <div class="flex items-center justify-between">
      <Button variant="ghost" class="p-1" @click="router.get('/sales')">
        <ArrowLeft class="h-4 w-4 mr-1" />
        Volver
      </Button>
    </div>

    <!-- Información de la venta -->
    <Card>
      <CardHeader>
        <CardTitle>Detalle de Venta #{{ sale.id }}</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-muted-foreground">Cliente</p>
            <p class="font-medium">{{ sale.customerName }}</p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Fecha de Venta</p>
            <p class="font-medium">{{ formatDate(sale.date) }}</p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Método de Pago</p>
            <p class="font-medium">{{ getPaymentMethodName(sale.paymentMethod) }}</p>
          </div>
          <div>
            <p class="text-sm text-muted-foreground">Total</p>
            <p class="font-medium text-lg">{{ formatPrice(sale.total) }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Detalles de productos -->
    <Card>
      <CardHeader>
        <CardTitle>Productos</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Precio Unitario</TableHead>
              <TableHead>Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="detail in sale.details" :key="detail.productName">
              <TableCell>{{ detail.productName }}</TableCell>
              <TableCell>{{ formatQuantity(detail.quantity) }} {{ detail.unit }}</TableCell>
              <TableCell>{{ formatPrice(detail.unitPrice) }}</TableCell>
              <TableCell>{{ formatPrice(detail.subtotal) }}</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan="3" class="text-right font-medium">Total</TableCell>
              <TableCell class="font-bold">{{ formatPrice(sale.total) }}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
