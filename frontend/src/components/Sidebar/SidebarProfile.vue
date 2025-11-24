<template>
  <div v-if="!user" class="text-center mt-4 text-white">
    <button class="btn btn-dark" @click="$emit('login')">
      <i class="bi bi-github me-2"></i> Login with GitHub
    </button>
  </div>

  <div v-else class="text-center mb-4 text-white">
    <img 
      :src="user.avatar_url" 
      class="rounded-circle mb-2" 
      width="80" 
      alt="User Avatar"
    />
    <h5>{{ user.login }}</h5>
  </div>
</template>

<script setup>
defineProps({
  user: {
    type: Object,
    default: null
  }
})

defineEmits(['login'])
</script>