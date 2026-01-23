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

    <div v-if="showDelete" class="modal-backdrop" @click="$emit('closeDelete')">
      <div class="modal-window border-danger" @click.stop>
        <h5 class="text-danger mb-3">Delete Organization</h5>
        <p class="text-white mb-4">
          Are you sure you want to delete this organization? 
          <span class="d-block text-white-50 small mt-2">This action cannot be undone. All organization settings and member lists will be lost.</span>
        </p>
        
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" @click="$emit('closeDelete')">Cancel</button>
          <button class="btn btn-danger" @click="$emit('confirmDelete')">Delete Permanently</button>
        </div>
      </div>
    </div>

    <div v-if="showManageMembers" class="modal-backdrop" @click="$emit('closeManageMembers')">
      <div class="modal-window members-modal" @click.stop>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="text-white m-0">Members: {{ org?.name }}</h5>
          <button class="btn-close btn-close-white" @click="$emit('closeManageMembers')"></button>
        </div>

        <div class="members-list mb-4">
          <div v-for="m in org?.members" :key="m.user._id" class="member-item d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <img :src="m.user.avatar_url" class="avatar-sm" alt="avatar" />
              <div>
                <div class="text-white small">{{ m.user.login }}</div>
                <div class="text-muted" style="font-size: 0.7rem;">{{ m.role }}</div>
              </div>
            </div>
            <i v-if="m.role !== 'owner'" 
               class="bi bi-person-x text-danger action-icon" 
               @click="$emit('removeMember', { orgId: org._id, userId: m.user._id })"></i>
          </div>
        </div>

        <hr class="border-secondary" />

        <h6 class="text-white-50 small mb-2">Add New Member</h6>
        <div class="d-flex gap-2">
          <input v-model="memberForm.login" type="text" class="modal-input" placeholder="GitHub login" @keyup.enter="handleAddMember" />
          <select v-model="memberForm.role" class="modal-input w-auto">
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <button class="btn btn-primary btn-sm" @click="handleAddMember">Add</button>
        </div>
      </div>
    </div>

  </Teleport>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  showCreate: Boolean,
  showAddMember: Boolean,
  showDelete: Boolean,
  showManageMembers: Boolean,
  org: Object
})

const emit = defineEmits(['closeCreate', 'confirmCreate', 'closeAddMember', 'confirmAddMember','closeDelete', 'confirmDelete','closeManageMembers','removeMember'])

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
  emit('confirmAddMember', { login: memberForm.login, role: memberForm.role })
  memberForm.login = ''
}
</script>

<style scoped>
/* Dodatkowe style dla panelu członków */
.members-modal { width: 450px; }
.members-list { max-height: 200px; overflow-y: auto; background: #1d1e20; border-radius: 4px; padding: 5px; }
.member-item { padding: 8px; border-bottom: 1px solid #333; }
.member-item:last-child { border-bottom: none; }
.avatar-sm { width: 32px; height: 32px; border-radius: 50%; }
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
.border-danger {
  border-color: #dc3545 !important;
}
.modal-input {
  width: 100%; background: #1d1e20; border: 1px solid #444; color: white;
  padding: 8px 12px; border-radius: 4px; outline: none;
}
.modal-input:focus { border-color: #0d6efd; }
</style>