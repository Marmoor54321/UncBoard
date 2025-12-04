<template>
  <div class="issuebox mb-2 p-2 rounded" @click="$emit('click')">
    <div class="issuetitle">
      <strong>{{ title }}</strong>
    </div>
    <div class="issuebody small">{{ body }}</div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  body: {
    type: String,
    default: ''
  }
})

defineEmits(['click'])
</script>

<style scoped>
.issuebox {
  background-color: #3b3e42;
  color: white;
  padding: 10px;
  margin-bottom: 10px; /* Margines zostawiamy, lub przenosimy do gap w rodzicu */
  border-radius: 5px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
  cursor: grab;
  transition: background-color 0.2s;
}

.issuebox:hover {
  background-color: #50545b;
}

.issuetitle {
  margin-bottom: 5px;
}

.issuebody {
  font-size: 14px;
  color: #d1d1d1;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: break-word;
}
</style>