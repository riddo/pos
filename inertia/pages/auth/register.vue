<template>
    <Card class="w-full max-w-xl">
      <CardHeader>
        <CardTitle class="text-2xl">Registro</CardTitle>
        <CardDescription> Crea tu cuenta para acceder a la plataforma </CardDescription>
      </CardHeader>
      <CardContent>
        <form @submit.prevent="register" class="space-y-4">
          <div class="space-y-2">
            <Input v-model="form.fullName" placeholder="Tu nombre" required />
          </div>

          <div class="space-y-2">
            <Input
              v-model="form.email"
              type="email"
              placeholder="email@example.com"
              required
              @focus="touched.email = true"
              @input="checkEmail"
            />
            <p v-if="isCheckingEmail" class="text-sm text-gray-500">Verificando email...</p>
            <p v-if="emailExists" class="text-sm text-red-500">El email ya está en uso</p>
            <p v-if="touched.email && !isValidEmail" class="text-sm text-red-500">
              El correo electrónico no es válido
            </p>
          </div>

          <div class="space-y-2">
            <Select v-model="form.roleId" required class="w-full">
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  v-for="role in roles" 
                  :key="role.id" 
                  :value="role.id"
                >
                  {{ role.rol }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Input
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              required
              @focus="touched.password = true"
              @input="touched.password = true"
            />
            <div v-if="touched.password" class="space-y-2 bg-gray-50 p-3 rounded-md">
              <div
                v-for="(check, index) in passwordChecks"
                :key="index"
                class="flex items-center gap-2"
              >
                <template v-if="check.isValid">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-green-500"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </template>
                <template v-else>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="text-red-500"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </template>
                <span :class="check.isValid ? 'text-green-500' : 'text-red-500'" class="text-sm">
                  {{ check.text }}
                </span>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <Input
              v-model="form.confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              @focus="touched.confirmPassword = true"
              @input="touched.confirmPassword = true"
            />
            <p
              v-if="touched.confirmPassword && form.password !== form.confirmPassword"
              class="text-sm text-red-500"
            >
              Las contraseñas no coinciden
            </p>
          </div>

          <Button
            type="submit"
            class="w-full"
            :disabled="
              loading ||
              !isValidPassword ||
              !isValidEmail ||
              emailExists ||
              form.password !== form.confirmPassword
            "
          >
            {{ loading ? 'Registrando...' : 'Registrarse' }}
          </Button>
        </form>
        <div class="mt-4 text-center text-sm">
          ¿Ya tienes una cuenta?
          <Link href="/login" class="underline"> Inicia sesión </Link>
        </div>
      </CardContent>
    </Card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useForm, router } from '@inertiajs/vue3'

const props = defineProps({
  roles: {
    type: Array,
    required: true
  }
})

const form = useForm({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  roleId: '',
})

const emailExists = ref(false)
const isCheckingEmail = ref(false)

const touched = ref({
  email: false,
  password: false,
  confirmPassword: false,
})

const loading = ref(false)

const hasMinLength = computed(() => form.password.length >= 8)
const hasUpperCase = computed(() => /[A-Z]/.test(form.password))
const hasNumber = computed(() => /[0-9]/.test(form.password))
const hasSpecialChar = computed(() => /[@!$%^&*.]/.test(form.password))
const isValidPassword = computed(
  () => hasMinLength.value && hasUpperCase.value && hasNumber.value && hasSpecialChar.value
)
const isValidEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))

const passwordChecks = computed(() => [
  {
    isValid: hasMinLength.value,
    text: 'Mínimo 8 caracteres',
  },
  {
    isValid: hasUpperCase.value,
    text: 'Al menos 1 mayúscula',
  },
  {
    isValid: hasNumber.value,
    text: 'Al menos 1 número',
  },
  {
    isValid: hasSpecialChar.value,
    text: 'Al menos 1 caracter especial (@, !, $, etc.)',
  },
])

// ✅ Verifica si el email está en uso
let debounceTimer = null // Variable para almacenar el temporizador

const checkEmail = async () => {
  if (!isValidEmail.value) {
    emailExists.value = false
    return
  }

  // Cancela cualquier temporizador anterior
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }

  // Configura un nuevo temporizador
  debounceTimer = setTimeout(async () => {
    isCheckingEmail.value = true

    try {
      const response = await fetch(`/check-email?email=${encodeURIComponent(form.email)}`)
      const data = await response.json()
      emailExists.value = data.exists
    } catch (error) {
      console.error('Error al verificar email:', error)
    } finally {
      isCheckingEmail.value = false
    }
  }, 500) // Retraso de 500ms
}

const register = async () => {
  if (!isValidEmail.value || emailExists.value) {
    alert('El correo electrónico')
    return
  }
  if (!isValidPassword.value) {
    alert('La contraseña debe cumplir con los requisitos')
    return
  }
  if (form.password !== form.confirmPassword) {
    alert('Las contraseñas no coinciden')
    return
  }

  loading.value = true

  form.post('/register', {
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
