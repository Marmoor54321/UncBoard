<template>
  <Teleport to="body">
    <div v-if="showCreate" class="modal-backdrop" @click.self="$emit('closeCreate')">
      <div class="modal-card animate-modal">
        <h4 class="modal-title">Create new group</h4>
        <div class="modal-field">
          <label>Group name</label>
          <input
            v-model="localGroupName"
            type="text"
            placeholder="e.g. Frontend"
            class="modal-input"
            @keyup.enter="handleCreate"
          />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('closeCreate')">Cancel</button>
          <button class="btn-create" @click="handleCreate">Create</button>
        </div>
      </div>
    </div>
  </Teleport>

  <Teleport to="body">
    <div v-if="showDelete" class="modal-backdrop" @click.self="$emit('closeDelete')">
      <div class="modal-card animate-modal">
        <h4 class="modal-title text-danger">Delete group?</h4>
        <p class="text-white-50 mb-4">
          Are you sure you want to delete this group? <br />
          Repositories inside will not be deleted.
        </p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="$emit('closeDelete')">Cancel</button>
          <button class="btn-delete" @click="$emit('confirmDelete')">Delete</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  showCreate: Boolean,
  showDelete: Boolean,
})

const emit = defineEmits(['closeCreate', 'confirmCreate', 'closeDelete', 'confirmDelete'])

const localGroupName = ref('')

// Reset input when modal opens/closes
watch(() => props.showCreate, (val) => {
  if (!val) localGroupName.value = ''
})

function handleCreate() {
  if (!localGroupName.value.trim()) return
  emit('confirmCreate', localGroupName.value)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(4px);
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal-card {
  background: #2b2d31;
  padding: 24px;
  width: 360px;
  border-radius: 14px;
  border: 1px solid #444;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.45);
  color: white;
}
.animate-modal { animation: popupShow 0.18s ease; }
@keyframes popupShow {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}
.modal-title { font-size: 20px; margin-bottom: 16px; }
.modal-field { display: flex; flex-direction: column; margin-bottom: 18px; }
.modal-field label { font-size: 14px; margin-bottom: 6px; color: #cfcfcf; }
.modal-input {
  background: #1f2023; border: 1px solid #555; color: white;
  padding: 10px 12px; border-radius: 8px; transition: 0.15s;
}
.modal-input:focus { border-color: #aa50e7; outline: none; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
.btn-cancel { background: transparent; color: #ccc; border: 1px solid #555; padding: 8px 16px; border-radius: 8px; }
.btn-create { background: #aa50e7; color: white; border: none; padding: 8px 16px; border-radius: 8px; }
.btn-delete { background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 8px; }
</style>