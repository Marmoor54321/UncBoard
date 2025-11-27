<template>
  <div class="dropdown-container" ref="root">
    <div class="dropdown-trigger-wrapper" @click="toggle">
      <slot name="trigger" :isOpen="isOpen"></slot>
    </div>

    <div v-if="isOpen" class="dropdown-panel" :class="`placement-${placement}`">
      <div v-if="$slots.header" class="dropdown-header">
        <slot name="header"></slot>
      </div>

      <slot></slot>

      <div v-if="$slots.footer" class="dropdown-footer">
        <slot name="footer" :close="close"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

defineProps({
  placement: { type: String, default: 'bottom' }, // 'bottom' lub 'top'
})

const isOpen = ref(false)
const root = ref(null)

const toggle = () => {
  isOpen.value = !isOpen.value
}

const close = () => {
  isOpen.value = false
}

const handleClickOutside = (e) => {
  if (root.value && !root.value.contains(e.target)) {
    close()
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

defineExpose({ close })
</script>

<style scoped>
.dropdown-container {
  position: relative;
  display: inline-block;
}

.dropdown-trigger-wrapper {
  display: flex;
}

.dropdown-panel {
  position: absolute;
  left: 0;
  width: 260px;
  background: #222;
  border-radius: 8px;
  border: 1px solid #333;
  box-shadow: 0 4px 14px rgb(0 0 0 / 0.4);
  z-index: 99;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.placement-bottom {
  top: calc(100% + 6px);
  bottom: auto;
}
.placement-top {
  bottom: calc(100% + 6px);
  top: auto;
  box-shadow: 0 -4px 14px rgb(0 0 0 / 0.4);
}

.dropdown-footer {
  border-top: 1px solid #333;
  padding: 8px;
  background: #1a1a1a;
}
</style>
