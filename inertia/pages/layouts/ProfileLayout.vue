<script setup>
import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'

const page = usePage()
const props = defineProps({
  title: String,
})

const pageTitle = computed(() => {
  return props.title || page.props.title
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <title>{{ pageTitle }}</title>

    <!-- Contenido principal con márgenes laterales -->
    <main class="flex-1 flex justify-center items-center mx-auto max-w-8xl px-4 sm:px-6 lg:px-8 py-8 w-full">
      <slot />
    </main>

    <!-- Toaster para notificaciones -->
    <Toaster />
  </div>
</template> 