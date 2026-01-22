<template>
  <div class="issuebox mb-2 p-2 rounded" @click="$emit('click')">
    <div class="header-row d-flex justify-content-between align-items-start mb-1">
      <div class="issuetitle" :title="title">
        <strong>{{ title }}</strong>
      </div>

      <div v-if="assignees && assignees.length" class="assignees-container d-flex">
        <img 
          v-for="user in assignees" 
          :key="user.id" 
          :src="user.avatar_url" 
          :title="user.login"
          class="avatar-circle"
        />
      </div>
    </div>
    
    <div class="issuebody small">{{ body }}</div>

    <div v-if="labels && labels.length" class="labels-container mt-2">
      <span 
        v-for="label in labels" 
        :key="label.id" 
        class="label-pill"
        :style="{ backgroundColor: '#' + label.color, color: getContrastColor(label.color) }"
      >
        {{ label.name }}
      </span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: { type: String, required: true },
  body: { type: String, default: '' },
  labels: { type: Array, default: () => [] },
  assignees: { type: Array, default: () => [] }
})

defineEmits(['click'])

function getContrastColor(hexcolor) {
  hexcolor = hexcolor.replace("#", "");
  var r = parseInt(hexcolor.substr(0, 2), 16);
  var g = parseInt(hexcolor.substr(2, 2), 16);
  var b = parseInt(hexcolor.substr(4, 2), 16);
  var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
}
</script>

<style scoped>
.issuebox {
  background-color: #3b3e42;
  color: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
  cursor: grab;
  transition: background-color 0.2s;
}

.issuebox:hover {
  background-color: #50545b;
}

/* Układ nagłówka */
.header-row {
  display: flex;
  gap: 10px;
}

.issuetitle {
  flex: 1; /* Zajmuje całą dostępną przestrzeń */
  font-size: 0.95rem;
  line-height: 1.2;
  /* Ucinanie tekstu */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap; 
}

.issuebody {
  font-size: 0.85rem;
  color: #d1d1d1;
  max-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Etykiety */
.labels-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.label-pill {
  font-size: 0.65rem;
  padding: 1px 6px;
  border-radius: 10px;
  font-weight: 600;
}

/* Awatary w prawym górnym rogu */
.assignees-container {
  flex-shrink: 0; /* Zapobiega ściskaniu awatarów */
  padding-left: 8px; /* Odstęp od uciętego tytułu */
}

.avatar-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #3b3e42;
  margin-left: -6px;
  transition: transform 0.2s;
  background-color: #3b3e42;
}

.avatar-circle:first-child {
  margin-left: 0;
}

.avatar-circle:hover {
  transform: scale(1.2);
  z-index: 10;
}
</style>