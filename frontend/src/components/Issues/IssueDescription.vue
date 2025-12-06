<template>
  <div class="bg-dark rounded p-3 mb-4">
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h5 class="mb-0">Description</h5>
      <button v-if="!isEditing" class="btn btn-sm btn-link text-secondary text-decoration-none" @click="startEdit">
        Edit
      </button>
    </div>

    <div
      v-if="!isEditing"
      v-html="body ? renderMarkdown(body) : '<em class=\'text-secondary\'>No description provided</em>'"
      class="markdown-body"
      style="background: #303236; padding: 1rem; border-radius: 8px; overflow-wrap: break-word;"
    ></div>

    <div v-else>
      <textarea
        v-model="tempBody"
        class="form-control bg-dark text-white border-secondary mb-2"
        rows="6"
        style="background-color: #303236 !important"
      ></textarea>
      <div class="d-flex gap-2">
        <button class="btn-save" @click="save">Save</button>
        <button class="btn-cancel" @click="cancel">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useMarkdown } from '../../composables/useMarkdown' // Import composable
import 'github-markdown-css/github-markdown-dark.css'

const props = defineProps({ body: String })
const emit = defineEmits(['update-body'])

const { renderMarkdown } = useMarkdown()

const isEditing = ref(false)
const tempBody = ref('')

const startEdit = () => {
  tempBody.value = props.body || ''
  isEditing.value = true
}

const cancel = () => {
  isEditing.value = false
}

const save = () => {
  emit('update-body', tempBody.value)
  isEditing.value = false
}
</script>

<style scoped>
/* Te same style przycisków co w Header, można je wynieść do globalnych styli CSS */
.btn-save { background: #aa50e7; color: white; border: none; padding: 5px 8px; border-radius: 8px; font-size: small;}
.btn-cancel { background: transparent; color: #ccc; border: 1px solid #555; padding: 5px 8px; border-radius: 8px; font-size: small;}
</style>