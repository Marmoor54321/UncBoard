<template>
  <transition name="alert-fade">
    <div v-if="alert.show" class="custom-alert" :class="`alert-${alert.type}`">
      <div class="alert-content">
        <span v-if="alert.type === 'error'" class="alert-icon">⚠️</span>
        <span v-else class="alert-icon">✅</span>
        
        <span class="alert-message">{{ alert.message }}</span>
      </div>
      <button class="alert-close" @click="closeAlert">&times;</button>
    </div>
  </transition>
</template>

<script setup>
import { useKanban } from '@/composables/useKanban.js'

const { alert, closeAlert } = useKanban()
</script>

<style scoped>
.custom-alert {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  min-width: 300px;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  font-weight: 500;
  backdrop-filter: blur(10px);
}

.alert-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.alert-error {
  background-color: rgba(220, 53, 69, 0.9); 
  color: white;
  border: 1px solid #b02a37;
}

.alert-success {
  background-color: rgba(25, 135, 84, 0.9); 
  color: white;
  border: 1px solid #146c43;
}

.alert-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0 0 0 15px;
  line-height: 1;
  opacity: 0.8;
}

.alert-close:hover {
  opacity: 1;
}

.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: all 0.3s ease;
}

.alert-fade-enter-from,
.alert-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>