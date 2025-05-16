<template>
  <header class="fixed top-0 z-30 flex h-12 items-center justify-between gap-4 border-b bg-background w-full pl-4 pr-4">
    <Sheet>
      <SheetTrigger as-child>
        <Button size="icon" variant="outline" class="sm:hidden">
          <PanelLeft class="h-5 w-5" />
          <span class="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" class="sm:max-w-xs">
        <nav class="grid gap-6 text-lg font-medium">
          <a href="#" class="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base">
            <Package2 class="h-5 w-5 transition-all group-hover:scale-110" />
            <span class="sr-only">Acme Inc</span>
          </a>
          <a href="#" class="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
            <Home class="h-5 w-5" />
            Dashboard
          </a>
          <a href="#" class="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
            <ShoppingCart class="h-5 w-5" />
            Orders
          </a>
          <a href="#" class="flex items-center gap-4 px-2.5 text-foreground">
            <Package class="h-5 w-5" />
            Products
          </a>
          <a href="#" class="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
            <Users2 class="h-5 w-5" />
            Customers
          </a>
          <a href="#" class="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
            <LineChart class="h-5 w-5" />
            Settings
          </a>
        </nav>
      </SheetContent>
    </Sheet>

    <!-- Logo -->
    <Link href="/" class="flex items-center gap-2">
    <ShoppingBag class="h-6 w-6 text-blue-800" />
    <span class="text-lg font-bold">AtacamaPOS</span>
    </Link>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="secondary" size="icon" class="rounded-md w-fit px-4 bg-transparent">
          <div class="flex flex-col">
            <span class="text-sm font-medium">{{ props.user.fullName }}</span>
            <span class="text-xs text-muted-foreground">{{ props.user.role.rol }}</span>
          </div>
          <Avatar class="border border-gray-30">

            <AvatarImage :src="`/inertia/public/profiles/${props.user.profileImage}`" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/profile">
        <DropdownMenuItem class="cursor-pointer">Perfil</DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <form @submit.prevent="logout">
          <DropdownMenuItem>
            <button type="submit">Cerrar sesión</button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>

<script setup>
import {
    Boxes,
  CircleUser,
  File,
  Home,
  LineChart,
  ListFilter,
  MoreHorizontal,
  Package,
  Package2,
  PanelLeft,
  PlusCircle,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Users2,
} from 'lucide-vue-next'

import { usePage, useForm } from '@inertiajs/vue3'
const { props, url } = usePage()
const breadcrumb = props.breadcrumb ?? [] // Accede al breadcrumb directamente
const form = useForm()
console.log(props.user)

const logout = async () => {
  await form.post('/logout')
}
</script>
