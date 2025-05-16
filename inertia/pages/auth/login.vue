<template>
  <Card class="mx-auto max-w-sm min-w-[350px] flex flex-col gap-4 py-4">
    <CardHeader class="flex flex-row justify-center items-center gap-2">
      <ShoppingBag class="h-10 w-10 text-blue-800" />
      <h1 class="text-3xl font-bold">AtacamaPOS</h1>
    </CardHeader>
    <CardContent>
      <form class="grid gap-8" @submit.prevent="login">
        <div class="grid gap-2">
          <Label for="email">Correo</Label>
          <Input v-model="form.email" type="email" placeholder="m@example.com" required />
        </div>
        <div class="grid gap-2">
          <div class="flex items-center">
            <Label for="password">Contraseña</Label>
            <a href="#" class="ml-auto inline-block text-sm underline">
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <Input v-model="form.password" type="password" placeholder="********" required />
          <p v-if="errorMessage" class="text-red-500 text-sm px-1">{{ errorMessage }}</p>
        </div>
        <Button type="submit" class="w-full text-md h-10"> Iniciar sesión </Button>
      </form>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useForm, usePage } from '@inertiajs/vue3'
import { ShoppingBag } from 'lucide-vue-next'

const page = usePage()

const errorMessage = computed(() => {
  const errors = page.props.errors
  return errors?.message || ''
})

const form = useForm({
  email: '',
  password: '',
})

const loading = ref(false)

const login = async () => {
  loading.value = true
  form.post('/login', {
    onStart: () => {
      loading.value = true
    },
    onFinish: () => {
      loading.value = false
    },
    onError: (errors) => {
      console.error('Errores:', errors)
    },
  })
}
</script>
