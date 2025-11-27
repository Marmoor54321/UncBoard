<template>
  <input
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    type="text"
    :placeholder="placeholder"
    class="dropdown-search"
    ref="inputRef"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue'

defineProps({
  modelValue: String,
  placeholder: { type: String, default: 'Search...' },
})

defineEmits(['update:modelValue'])

const inputRef = ref(null)

onMounted(() => {
  inputRef.value?.focus()
})
</script>

<style scoped>
.dropdown-search {
  width: 100%;
  padding: 8px;
  background: #111;
  border: none;
  border-bottom: 1px solid #333;
  color: white;
  outline: none;
  border-radius: 8px 8px 0 0;
  flex-shrink: 0;
}
</style>
