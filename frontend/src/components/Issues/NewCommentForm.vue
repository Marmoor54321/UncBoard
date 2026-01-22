<template>
  <div class="border-top border-secondary pt-3 mt-3">
    <h6 class="mb-2">Add a comment</h6>
    <textarea
      v-model="commentBody"
      class="form-control bg-dark text-white border-secondary mb-2 custom-placeholder"
      rows="4"
      placeholder="Leave a comment"
      style="background-color: #303236 !important"
    ></textarea>
    <div class="d-flex justify-content-end gap-2">
      <button 
        class="btn-save d-flex align-items-center gap-2" 
        @click="submit" 
        :disabled="loading || !commentBody.trim()"
      >
        <span v-if="loading" class="spinner-border spinner-border-sm"></span>
        Comment
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({ loading: Boolean })
const emit = defineEmits(['submit'])

const commentBody = ref('')

const submit = () => {
  emit('submit', commentBody.value)
  commentBody.value = '' 
}
</script>

<style scoped>
.btn-save { background: #aa50e7; color: white; border: none; padding: 5px 8px; border-radius: 8px; font-size: small;}
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.custom-placeholder::placeholder {
  color: #adb5bd; 
  opacity: 1;  
}
</style>