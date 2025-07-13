<script setup lang="ts">
import axios from './utils/http';
import { onMounted } from 'vue';
import { RouterView, useRoute } from 'vue-router'
import { useUserStore } from './stores/user';
import NavBar from '@/components/NavBar.vue';

const user = useUserStore()
const route = useRoute()
onMounted(async () => {
  try {
    const response = await axios.get("/user/me", { showToast: false })
    user.login(response.data.user)
  } catch (error) {
    user.logout()
  }
})
</script>

<template>
  <NavBar />
  <div class="w-full flex-1 flex flex-col" :class="{ 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8': !route.meta.full }">
    <RouterView />
  </div>
</template>