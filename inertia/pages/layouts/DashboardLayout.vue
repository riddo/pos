<script setup>
import Sidebar from '~/components/layout/Sidebar.vue'
import Header from '~/components/layout/Header.vue'
import { useUIStore } from '~/stores/ui'

const uiStore = useUIStore()
</script>

<template>
  <Toaster />
  <div class="flex w-full flex-col bg-muted/40">
    <Header />
    <div class="flex h-full sm:gap-4 pt-16 transition-all duration-300" :class="uiStore.isSidebarCollapsed ? 'sm:pl-[60px]' : 'sm:pl-[200px]'">
      <Sidebar />
      <main class="grid flex-1 items-start h-full gap-4 p-4 sm:px-6 sm:py-0 md:gap-2">
        <slot></slot>
      </main>
    </div>
  </div>
</template>
