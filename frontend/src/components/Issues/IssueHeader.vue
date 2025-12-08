<template>
  <div class="d-flex justify-content-between align-items-center mb-3">
    <div v-if="!isEditing" class="d-flex align-items-center flex-grow-1 me-3">
      <h2 class="mb-0 me-3">
        <a :href="url" target="_blank" rel="noopener noreferrer" >
          {{ title }}
        </a>          
      </h2>        
      <button class="btn btn-sm btn-link text-secondary p-0" @click="startEdit">
        <i class="bi bi-pencil-fill"></i>
      </button>
    </div>

    <div v-else class="flex-grow-1 me-3">
      <input
        v-model="tempTitle"
        type="text"
        class="form-control bg-dark text-white border-secondary mb-2"
        @keyup.enter="save"
      />
      <div class="d-flex gap-2">
        <button class="btn-save" @click="save">Save</button>
        <button class="btn-cancel" @click="cancel">Cancel</button>
      </div>
    </div>

    <button class="btn btn-outline-light btn-sm ms-2" @click="$emit('close')">
      <i class="bi bi-x-lg"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  title: String,
  url: String
})

const emit = defineEmits(['close', 'update-title'])

const isEditing = ref(false)
const tempTitle = ref('')

const startEdit = () => {
  tempTitle.value = props.title
  isEditing.value = true
}

const cancel = () => {
  isEditing.value = false
}

const save = () => {
  if (!tempTitle.value.trim()) return
  emit('update-title', tempTitle.value)
  isEditing.value = false
}
</script>

<style scoped>
.btn-save { background: #aa50e7; color: white; border: none; padding: 5px 8px; border-radius: 8px; font-size: small;}
.btn-cancel { background: transparent; color: #ccc; border: 1px solid #555; padding: 5px 8px; border-radius: 8px; font-size: small;}
</style>