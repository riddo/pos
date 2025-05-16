<script setup>
import { Head } from '@inertiajs/vue3'
import { ref, computed } from 'vue'
import { useForm, usePage } from '@inertiajs/vue3'
import { toast } from '~/components/ui/toast/use-toast'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Shield, 
  Key, 
  Save,
  Camera,
  UserCircle,
  BadgeCheck,
  Calendar,
  Clock,
  MapPinned,
  ArrowLeft,
  Lock,
  Eye
} from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog'

const page = usePage()
console.log(page.props.user)

const formatDateTime = (dateTime) => {
  if (!dateTime) return ''
  const date = new Date(dateTime)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).replace(',', '')
}

// Datos del usuario
const userData = {
  name: page.props.user.fullName,
  email: page.props.user.email,
  phone: page.props.user.phone || '',
  address: page.props.user.address || '',
  role: page.props.role,
  lastLogin: formatDateTime(page.props.user.lastLoginAt),
  memberSince: formatDateTime(page.props.user.createdAt),
  location: 'Ciudad de México, México',
  profileImage: page.props.user.profileImage
}

// Formulario para datos personales
const personalForm = useForm({
  name: userData.name,
  email: userData.email,
  phone: userData.phone,
  address: userData.address,
  role: userData.role,
})

// Estado para el modal de cambio de contraseña
const showPasswordModal = ref(false)

// Formulario para cambio de contraseña
const passwordForm = useForm({
  currentPassword: '',
  password: '',
  passwordConfirmation: '',
})

// Estado para mostrar/ocultar secciones
const activeTab = ref('personal')

// Estado para mostrar/ocultar contraseñas
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

// Función para actualizar perfil
const updateProfile = () => {
  personalForm.put('/profile', {
    onSuccess: () => {
      toast({
        title: 'Perfil actualizado',
        description: 'Tus datos personales han sido actualizados correctamente.',
        duration: 3000,
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar el perfil',
        description: error.message,
        duration: 3000,
      })
    },
  })
}

// Función para cambiar contraseña
const changePassword = () => {
  passwordForm.put('/profile/change-password', {
    onSuccess: () => {
      showPasswordModal.value = false
      passwordForm.reset()
      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido actualizada correctamente.',
        duration: 3000,
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error al cambiar la contraseña',
        description: error.message,
        duration: 3000,
      })
    },
  })
}

// Función para subir avatar
const uploadedImage = ref(null); // Propiedad reactiva para almacenar la imagen subida

const uploadAvatar = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const avatarForm = useForm({
    avatar: file
  })
  
  // Almacenar el archivo en la propiedad reactiva
  uploadedImage.value = file;
  
  avatarForm.put('/profile/avatar', {
    preserveScroll: true,
    onSuccess: () => {
      toast({
        title: 'Avatar actualizado',
        description: 'Tu imagen de perfil ha sido actualizada correctamente.',
        duration: 3000,
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar el avatar',
        description: error.message,
        duration: 3000,
      })
    },
  })
}

// Computed para la URL de la imagen de perfil
const profileImageUrl = computed(() => {
  if (uploadedImage.value) {
    return URL.createObjectURL(uploadedImage.value); // Crear URL de objeto para la imagen subida
  }
  if (!userData.profileImage || userData.profileImage === 'default-avatar.png') {
    return null
  }
  return `/inertia/public/profiles/${userData.profileImage}`
})

// Obtener iniciales para avatar por defecto
const userInitials = computed(() => {
  if (!userData.name) return 'U'
  return userData.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
})

</script>

<template>

  <Head title="Mi Perfil" />

  <div class="flex flex-col h-full gap-4">
    <div>
      <Link href="/pos">
      <Button variant="outline">
        <ArrowLeft class="h-4 w-4 mr-2" />
        Volver
      </Button>
      </Link>
    </div>
    <div class="flex flex-col md:flex-row gap-8 flex-1">
      <!-- Sidebar con avatar y navegación -->
      <div class="w-full md:w-2/5">
        <div class="bg-white rounded-lg shadow-md overflow-hidden h-full">
          <!-- Avatar y nombre -->
          <div class="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-center">
            <div class="relative mx-auto mb-4 w-32 h-32 rounded-full bg-white/20 flex items-center justify-center overflow-hidden group">
              <template v-if="profileImageUrl">
                <img :src="profileImageUrl" class="w-full h-full object-cover" :alt="userData.name" />
              </template>
              <template v-else>
                <UserCircle class="h-24 w-24 text-white" />
              </template>

              <!-- Overlay para cambiar avatar -->
              <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label class="cursor-pointer p-2 rounded-full bg-white/20 hover:bg-white/30">
                  <Camera class="h-6 w-6 text-white" />
                  <input type="file" class="hidden" accept="image/*" @change="uploadAvatar" />
                </label>
              </div>
            </div>
            <h2 class="text-xl font-bold">{{ userData.name }}</h2>
            <div class="flex items-center justify-center mt-1 text-blue-100">
              <BadgeCheck class="h-4 w-4 mr-1" />
              <p>{{ userData.role }}</p>
            </div>
          </div>

          <!-- Información adicional -->
          <div class="p-4 flex flex-col gap-2">
            <div class="flex items-center text-sm text-gray-600 mb-2">
              <Calendar class="h-4 w-4 mr-2 text-gray-400" />
              <span>Miembro desde {{ userData.memberSince }}</span>
            </div>
            <div class="flex items-center text-sm text-gray-600 mb-2">
              <Clock class="h-4 w-4 mr-2 text-gray-400" />
              <span>Último acceso {{ userData.lastLogin }}</span>
            </div>
            <!-- Botón para cambiar contraseña -->
            <Button variant="outline" class="mt-4 w-full" @click="showPasswordModal = true">
              <Lock class="h-4 w-4 mr-2" />
              Cambiar contraseña
            </Button>
          </div>

        </div>
      </div>

      <!-- Contenido principal -->
      <div class="w-full md:w-3/5">
        <div class="bg-white rounded-lg shadow-md p-6 h-full">
          <!-- Información personal -->
          <div v-if="activeTab === 'personal'">
            <h3 class="text-xl font-bold mb-6 pb-2 border-b flex items-center">
              <User class="h-6 w-6 mr-2 text-blue-600" />
              Información Personal
            </h3>

            <form @submit.prevent="updateProfile" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Nombre -->
                <div class="flex flex-col gap-2">
                  <Label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo</Label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User class="h-5 w-5 text-gray-400" />
                    </div>
                    <Input v-model="personalForm.name" type="text" class="pl-10" placeholder="Tu nombre completo" />
                  </div>
                  <p v-if="personalForm.errors.name" class="mt-1 text-sm text-red-600">{{ personalForm.errors.name }}</p>
                </div>

                <!-- Email -->
                <div class="flex flex-col gap-2">
                  <Label class="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</Label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail class="h-5 w-5 text-gray-400" />
                    </div>
                    <Input v-model="personalForm.email" type="email" class="pl-10" placeholder="tu@email.com" readonly />
                  </div>
                  <p v-if="personalForm.errors.email" class="mt-1 text-sm text-red-600">{{ personalForm.errors.email }}</p>
                </div>

                <!-- Teléfono -->
                <div class="flex flex-col gap-2">
                  <Label class="block text-sm font-medium text-gray-700 mb-1">Teléfono</Label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone class="h-5 w-5 text-gray-400" />
                    </div>
                    <Input v-model="personalForm.phone" type="tel" class="pl-10" placeholder="+52 555 123 4567" />
                  </div>
                  <p v-if="personalForm.errors.phone" class="mt-1 text-sm text-red-600">{{ personalForm.errors.phone }}</p>
                </div>

                <!-- Dirección -->
                <div class="flex flex-col gap-2">
                  <Label class="block text-sm font-medium text-gray-700 mb-1">Dirección</Label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin class="h-5 w-5 text-gray-400" />
                    </div>
                    <Input v-model="personalForm.address" type="text" class="pl-10" placeholder="Tu dirección" />
                  </div>
                  <p v-if="personalForm.errors.address" class="mt-1 text-sm text-red-600">{{ personalForm.errors.address }}</p>
                </div>

                <!-- Rol (solo lectura) -->
                <div class="flex flex-col gap-2">
                  <Label class="block text-sm font-medium text-gray-700 mb-1">Rol</Label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building class="h-5 w-5 text-gray-400" />
                    </div>
                    <Input v-model="personalForm.role" type="text" class="pl-10" readonly />
                  </div>
                </div>
              </div>

              <!-- Botón de guardar -->
              <div class="flex justify-end">
                <button type="submit" class="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" :disabled="personalForm.processing" @click="updateProfile">
                  <Save class="h-5 w-5 mr-2" />
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>

          <!-- Seguridad -->
          <div v-if="activeTab === 'security'">
            <h3 class="text-xl font-bold mb-6 pb-2 border-b flex items-center">
              <Shield class="h-6 w-6 mr-2 text-blue-600" />
              Cambiar contraseña
            </h3>

            <form @submit.prevent="changePassword" class="space-y-6">
              <!-- Contraseña actual -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key class="h-5 w-5 text-gray-400" />
                  </div>
                  <input v-model="passwordForm.currentPassword" :type="showCurrentPassword ? 'text' : 'password'" class="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Tu contraseña actual" />
                  <button type="button" @click="showCurrentPassword = !showCurrentPassword" class="absolute right-0 top-0 mt-2 mr-3">
                    <Eye class="h-5 w-5 text-gray-400" />
                  </button>
                </div>
                <p v-if="passwordForm.errors.currentPassword" class="mt-1 text-sm text-red-600">{{ passwordForm.errors.currentPassword }}</p>
              </div>

              <!-- Nueva contraseña -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key class="h-5 w-5 text-gray-400" />
                  </div>
                  <input v-model="passwordForm.password" :type="showNewPassword ? 'text' : 'password'" class="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Nueva contraseña" />
                  <button type="button" @click="showNewPassword = !showNewPassword" class="absolute right-0 top-0 mt-2 mr-3">
                    <Eye class="h-5 w-5 text-gray-400" />
                  </button>
                </div>
                <p v-if="passwordForm.errors.password" class="mt-1 text-sm text-red-600">{{ passwordForm.errors.password }}</p>
              </div>

              <!-- Confirmar contraseña -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key class="h-5 w-5 text-gray-400" />
                  </div>
                  <input v-model="passwordForm.passwordConfirmation" :type="showConfirmPassword ? 'text' : 'password'" class="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Confirma tu nueva contraseña" />
                  <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-0 top-0 mt-2 mr-3">
                    <Eye class="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <!-- Botón de guardar -->
              <div class="flex justify-end">
                <button type="submit" class="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" :disabled="passwordForm.processing">
                  <Save class="h-5 w-5 mr-2" />
                  Actualizar contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de cambio de contraseña -->
    <Dialog :open="showPasswordModal" @update:open="showPasswordModal = false">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <Lock class="h-5 w-5" />
            Cambiar contraseña
          </DialogTitle>
          <DialogDescription>
            Por favor, ingresa tu contraseña actual y la nueva contraseña.
          </DialogDescription>
        </DialogHeader>

        <form @submit.prevent="changePassword" class="space-y-4">
          <!-- Contraseña actual -->
          <div class="space-y-2">
            <Label>Contraseña actual</Label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key class="h-5 w-5 text-gray-400" />
              </div>
              <Input v-model="passwordForm.currentPassword" :type="showCurrentPassword ? 'text' : 'password'" class="pl-10" placeholder="Ingresa tu contraseña actual" />
              <button type="button" @click="showCurrentPassword = !showCurrentPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Eye class="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p v-if="passwordForm.errors.currentPassword" class="text-sm text-red-500">
              {{ passwordForm.errors.currentPassword }}
            </p>
          </div>

          <!-- Nueva contraseña -->
          <div class="space-y-2">
            <Label>Nueva contraseña</Label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key class="h-5 w-5 text-gray-400" />
              </div>
              <Input v-model="passwordForm.password" :type="showNewPassword ? 'text' : 'password'" class="pl-10" placeholder="Ingresa tu nueva contraseña" />
              <button type="button" @click="showNewPassword = !showNewPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Eye class="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <p v-if="passwordForm.errors.password" class="text-sm text-red-500">
              {{ passwordForm.errors.password }}
            </p>
          </div>

          <!-- Confirmar nueva contraseña -->
          <div class="space-y-2">
            <Label>Confirmar nueva contraseña</Label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key class="h-5 w-5 text-gray-400" />
              </div>
              <Input v-model="passwordForm.passwordConfirmation" :type="showConfirmPassword ? 'text' : 'password'" class="pl-10" placeholder="Confirma tu nueva contraseña" />
              <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <Eye class="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="showPasswordModal = false">
              Cancelar
            </Button>
            <Button type="submit" :disabled="passwordForm.processing">
              Cambiar contraseña
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template> 