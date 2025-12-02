<template>
  <BaseModal
    :show="showCreate"
    default-title="Create new group"
    @close="$emit('closeCreate')"
    @confirm="handleCreate"
  >
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
  </BaseModal>

  <BaseModal
    :show="showDelete"
    default-title="Delete group?"
    :is-delete="true"
    @close="$emit('closeDelete')"
    @confirm="$emit('confirmDelete')"
  >
    <p class="text-white-50 mb-4">
      Are you sure you want to delete this group? <br />
      Repositories inside will not be deleted.
    </p>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import BaseModal from '../Modals/BaseModal.vue';

const props = defineProps({
  showCreate: Boolean,
  showDelete: Boolean,
});

const emit = defineEmits(['closeCreate', 'confirmCreate', 'closeDelete', 'confirmDelete']);

const localGroupName = ref('');

// Reset input when modal opens/closes
watch(() => props.showCreate, (val) => {
  if (!val) localGroupName.value = '';
});

function handleCreate() {
  if (!localGroupName.value.trim()) return;
  emit('confirmCreate', localGroupName.value);
}
</script>

<style scoped>

.text-danger { color: #dc3545 !important; }
.text-white-50 { color: rgba(255, 255, 255, 0.5) !important; }
</style>