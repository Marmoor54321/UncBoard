<template>
  <div>
    
    <Teleport to="body">
      <div v-if="showCreate" class="modal-backdrop custom-backdrop" @click="$emit('closeCreate')">
        <div class="modal-window" @click.stop>
          <div class="modal-header mb-3">
             <h5 class="text-white m-0">Create Organization</h5>
          </div>

          <div class="modal-field">
            <label>Name</label>
            <input 
              v-model="form.name" 
              type="text" 
              class="modal-input" 
              placeholder="My Cool Team" 
              @keyup.enter="handleCreate"
            />
          </div>

          <div class="modal-field">
            <label>Description</label>
            <input 
              v-model="form.description" 
              type="text" 
              class="modal-input" 
              placeholder="Optional description" 
              @keyup.enter="handleCreate"
            />
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4">
            <button class="btn btn-secondary btn-sm" @click="$emit('closeCreate')">Cancel</button>
            <button class="btn btn-primary btn-sm" @click="handleCreate">Create</button>
          </div>
        </div>
      </div>
    </Teleport>

    

    <Teleport to="body">
      <div v-if="showDelete" class="modal-backdrop custom-backdrop" @click="$emit('closeDelete')">
        <div class="modal-window" @click.stop>
          <div class="modal-header mb-3">
             <h5 class="text-white m-0">Delete Organization</h5>
          </div>

          <p class="text-white mb-2">
            Are you sure you want to delete this organization? 
          </p>
          <span class="d-block text-white-50 small">
            This action cannot be undone. All organization settings and member lists will be lost.
          </span>

          <div class="d-flex justify-content-end gap-2 mt-4">
            <button class="btn btn-secondary btn-sm" @click="$emit('closeDelete')">Cancel</button>
            <button class="btn btn-danger btn-sm" @click="$emit('confirmDelete')">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showManageMembers" class="modal-backdrop custom-backdrop" @click="$emit('closeManageMembers')">
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
                  <div class="text-white" style="font-size: 0.7rem;">{{ m.role }}</div>
                </div>
              </div>
              <i v-if="m.role !== 'owner'" 
                 class="bi bi-person-x text-danger action-icon" 
                 style="cursor: pointer;"
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

  </div>
</template>

<script setup>
import { reactive } from 'vue'
// Usuwamy import BaseModal, bo przenieśliśmy kod tutaj
// import BaseModal from '../Modals/BaseModal.vue' 

const props = defineProps({
  showCreate: Boolean,
  showAddMember: Boolean,
  showDelete: Boolean,
  showManageMembers: Boolean,
  org: Object
})

const emit = defineEmits([
  'closeCreate', 'confirmCreate', 
  'closeAddMember', 'confirmAddMember',
  'closeDelete', 'confirmDelete',
  'closeManageMembers','removeMember'
])

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
/* Te style są kluczowe, bo usunęliśmy BaseModal, który mógł je dostarczać */
.custom-backdrop {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center; z-index: 10000;
}

.modal-window {
  background: #2b2d31; padding: 20px; border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #444;
  min-width: 350px; /* Dodane dla lepszego wyglądu */
}

/* Style dla sekcji modal-field (paddingi itp) */
.modal-field {
  margin-bottom: 15px;
}
.modal-field label {
  display: block;
  color: #ccc;
  font-size: 0.85rem;
  margin-bottom: 5px;
}

.members-modal { width: 450px; } 
.members-list { max-height: 200px; overflow-y: auto; background: #1d1e20; border-radius: 4px; padding: 5px; }
.member-item { padding: 8px; border-bottom: 1px solid #333; }
.member-item:last-child { border-bottom: none; }
.avatar-sm { width: 32px; height: 32px; border-radius: 50%; }

.modal-input {
  width: 100%; background: #1f2023; border: 1px solid #555; color: white;
  padding: 8px 12px; border-radius: 8px; outline: none; transition: 0.15s;
}
.modal-input:focus { border-color: #aa50e7; }

/* Style dla przycisków */
.btn-primary { background-color: #aa50e7; border-color: #aa50e7; }
.btn-secondary { background-color: #444; border-color: #444; color: #fff; }
.btn-danger { background-color: #dc3545; border-color: #dc3545; }

.btn-primary:hover { background-color: #993ee0; border-color: #993ee0; }
.btn-secondary:hover { background-color: #555; border-color: #555; }
.btn-danger:hover { background-color: #c82333; border-color: #c82333}
</style>