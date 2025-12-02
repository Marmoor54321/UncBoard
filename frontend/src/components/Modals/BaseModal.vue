<template>
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop" @click.self="handleBackdropClick">
      <div class="modal-card animate-modal">
        <h4 class="modal-title" :class="{ 'text-danger': isDelete }">
          <slot name="title">{{ defaultTitle }}</slot>
        </h4>

        <div class="modal-content">
          <slot></slot>
        </div>

        <div class="modal-actions">
          <slot name="actions">
            <button class="btn-cancel" @click="$emit('close')">Cancel</button>
            <button 
              :class="isDelete ? 'btn-delete' : 'btn-create'" 
              @click="$emit('confirm')"
            >
              {{ isDelete ? 'Delete' : 'Create' }}
            </button>
          </slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  show: Boolean,
  defaultTitle: String,
  isDelete: {
    type: Boolean,
    default: false,
  },
  disableBackdropClose: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'confirm']);

function handleBackdropClick() {
  if (!props.disableBackdropClose) {
    emit('close');
  }
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

/* Animacja */
.animate-modal {
  animation: popupShow 0.18s ease;
}

@keyframes popupShow {
  from {
    opacity: 0;
    transform: scale(0.92);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

:deep(.modal-field) {
  display: flex;
  flex-direction: column;
  margin-bottom: 18px;
}

:deep(.modal-field label) {
  font-size: 14px;
  margin-bottom: 6px;
  color: #cfcfcf;
}

:deep(.modal-input) {
  background: #1f2023;
  border: 1px solid #555;
  color: white;
  padding: 10px 12px;
  border-radius: 8px;
  transition: 0.15s;
  width: 100%;
}

:deep(.modal-input:focus) {
  border-color: #aa50e7;
  outline: none;
  box-shadow: 0 0 4px rgba(170, 80, 231, 0.4);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.btn-cancel) {
  background: transparent;
  color: #ccc;
  border: 1px solid #555;
  padding: 8px 16px;
  border-radius: 8px;
  transition: 0.15s;
}

:deep(.btn-cancel:hover) {
  background: #3a3b3f;
  border-color: #777;
}

:deep(.btn-create) {
  background: #aa50e7;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: 0.15s;
}

:deep(.btn-create:hover) {
  background: #b964f1;
}

:deep(.btn-delete) {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: 0.15s;
}

:deep(.btn-delete:hover) {
  background: #bb2d3b;
}
</style>