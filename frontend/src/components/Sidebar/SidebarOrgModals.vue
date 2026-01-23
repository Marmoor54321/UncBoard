<template>
  <Teleport to="body">
    <div v-if="showCreate" class="modal-backdrop" @click="$emit('closeCreate')">
      <div class="modal-window" @click.stop>
        <h5 class="text-white mb-3">Create Organization</h5>
        
        <label class="text-white-50 mb-1">Name</label>
        <input v-model="form.name" type="text" class="modal-input mb-3" placeholder="My Cool Team" />

        <label class="text-white-50 mb-1">Description</label>
        <input v-model="form.description" type="text" class="modal-input mb-4" placeholder="Optional description" />
        
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" @click="$emit('closeCreate')">Cancel</button>
          <button class="btn btn-primary" @click="handleCreate">Create</button>
        </div>
      </div>
    </div>

    <div v-if="showAddMember" class="modal-backdrop" @click="$emit('closeAddMember')">
      <div class="modal-window" @click.stop>
        <h5 class="text-white mb-3">Add Member</h5>
        <p class="text-white-50 small">User must have logged into this app before.</p>
        
        <label class="text-white-50 mb-1">GitHub Username</label>
        <input v-model="memberForm.login" type="text" class="modal-input mb-3" placeholder="e.g. octocat" />
        
        <label class="text-white-50 mb-1">Role</label>
        <select v-model="memberForm.role" class="modal-input mb-4">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>

        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" @click="$emit('closeAddMember')">Cancel</button>
          <button class="btn btn-primary" @click="handleAddMember">Add</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  showCreate: Boolean,
  showAddMember: Boolean
})

const emit = defineEmits(['closeCreate', 'confirmCreate', 'closeAddMember', 'confirmAddMember'])

const form = reactive({ name: '', description: '' })
const memberForm = reactive({ login: '', role: 'member' })

function handleCreate() {
  if (!form.name) return
  emit('confirmCreate', { ...form })
  form.name = ''
  form.description = ''
}

function handleAddMember() {
  if (!memberForm.login) return
  emit('confirmAddMember', { ...memberForm })
  memberForm.login = ''
  memberForm.role = 'member'
}
</script>

<style scoped>
/* Te same style co w innych modalach */
.modal-backdrop {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; z-index: 10000;
}
.modal-window {
  background: #2b2d31; padding: 20px; border-radius: 8px; width: 400px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #444;
}
.modal-input {
  width: 100%; background: #1d1e20; border: 1px solid #444; color: white;
  padding: 8px 12px; border-radius: 4px; outline: none;
}
.modal-input:focus { border-color: #0d6efd; }
</style>