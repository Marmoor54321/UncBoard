<template>
  <header
    class="text-white p-3 d-flex justify-content-between align-items-center sticky-top"
    style="background-color: #303236; border-bottom: 1px solid #2b2d31; height: 70px;"
  >
    <div class="d-flex align-items-center gap-3">
      <button
        class="btn btn-dark d-lg-none"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#sidebarOffcanvas"
        aria-controls="sidebarOffcanvas"
      >
        <i class="bi bi-list"></i>
      </button>

      <h1 class="m-0 fs-4 fw-bold">uncBoard</h1>
    </div>

    <div class="d-flex align-items-center">
      <div v-if="!user">
        <button class="btn btn-sm btn-outline-light d-flex align-items-center gap-2" @click="$emit('login')">
          <i class="bi bi-github"></i> 
          <span class="d-none d-sm-inline">Login</span>
        </button>
      </div>

      <div v-else class="d-flex align-items-center gap-3">
        <div class="text-end d-none d-sm-block" style="line-height: 1.2;">
          <span class="d-block fw-bold" style="font-size: 0.9rem;">{{ user.login }}</span>
        </div>
        <img 
          :src="user.avatar_url" 
          class="rounded-circle border border-secondary" 
          width="40" 
          height="40" 
          alt="User Avatar"
          style="cursor: pointer;"
        />
      </div>
    </div>
  </header>
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