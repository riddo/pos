<template>
  <div class="bg-white border rounded-md shadow-md p-2 text-sm">
    <div class="font-medium">{{ formattedTitle }}</div>
    <div class="flex items-center mt-1">
      <div class="w-3 h-3 rounded-full mr-2" :style="{ backgroundColor: data[0]?.color || '#1d4ed8' }"></div>
      <span>{{ data[0]?.name || 'Ventas' }}: {{ formatValue(data[0]?.value) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: String,
  data: Array
})

// Nombres de los días de la semana en español
const weekDays = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
]

// Nombres de los meses en español
const monthNames = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

// Extraer día, mes y año de los datos
const day = computed(() => props.data && props.data[1]?.value)
const month = computed(() => props.data && props.data[2]?.value)
const year = computed(() => props.data && props.data[3]?.value)

// Crear un objeto Date para obtener el día de la semana
const dateObject = computed(() => {
  if (!day.value || !month.value || !year.value) return null
  
  // Convertir nombres de meses a números (0-11)
  let monthIndex = monthNames.findIndex(m => m.toLowerCase() === month.value.toLowerCase())
  if (monthIndex === -1) {
    // Si no se encuentra por nombre, intentar usar el valor directamente
    monthIndex = parseInt(month.value) - 1
  }
  
  return new Date(parseInt(year.value), monthIndex, parseInt(day.value))
})

// Obtener el nombre del día de la semana
const weekDay = computed(() => {
  if (!dateObject.value) return ''
  return weekDays[dateObject.value.getDay()]
})

// Formatear el título con día de la semana, día, mes y año
const formattedTitle = computed(() => {
  if (!day.value) return props.title || ''
  
  if (weekDay.value) {
    return `${weekDay.value} ${day.value} de ${month.value} del ${year.value}`
  }
  
  return `${day.value} de ${month.value} del ${year.value}`
})

// Formatear el valor con el símbolo $ y separadores de miles
function formatValue(value) {
  if (typeof value === 'number') {
    return `$${new Intl.NumberFormat('es').format(value)}`
  }
  return value
}
</script> 