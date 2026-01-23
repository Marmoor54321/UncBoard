<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mt-4">
      <h6 class="text-white m-0">Organizations</h6>
      <button class="add-btn" @click="$emit('openCreateOrg')">
        <i class="bi bi-plus-lg"></i>
      </button>
    </div>

    <ul class="list-group custom-list">
      <li
        v-for="org in orgsList"
        :key="org._id"
        class="list-group-item"
        :class="{ expanded: expandedOrgs[org._id] }"
      >
        <div
          class="d-flex justify-content-between align-items-center group-header"
          @click="toggleExpand(org._id)"
        >
          <span class="text-truncate" style="max-width: 180px;">{{ org.name }}</span>
          <i class="bi" :class="expandedOrgs[org._id] ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
        </div>

        <transition name="slide">
          <ul v-if="expandedOrgs[org._id]" class="list-group nested-list">
            
            <div class="d-flex justify-content-between px-2 py-1 mb-1 border-bottom border-secondary">
              <small class="text-muted" style="font-size: 0.75rem">
                Members: {{ org.members.length }}
              </small>
              <div class="d-flex gap-2">
                <i class="bi bi-person-plus action-icon text-primary" 
                   title="Add Member"
                   @click.stop="$emit('openAddMember', org._id)"></i>

                <div class="d-flex gap-2">
                <i class="bi bi-people action-icon text-primary" 
                    title="Manage Members"
                    @click.stop="$emit('openManageMembers', org)"></i>
                    
                </div>
                <i class="bi bi-trash action-icon text-danger" 
                   title="Delete Organization"
                   @click.stop="$emit('openDeleteOrg', org._id)"></i>
              </div>
            </div>

            <li
              v-for="repoId in org.repo_ids"
              :key="repoId"
              class="list-group-item nested-item d-flex justify-content-between align-items-center repo-item"
              :class="{ active: selectedRepo && selectedRepo.id === repoId }"
              @click="$emit('selectRepo', repoMap[repoId])"
            >
              <span class="text-truncate">{{ repoMap[repoId]?.name || 'Unknown repo' }}</span>
              
              <i
                class="bi bi-three-dots-vertical text-white ms-2 dots-icon"
                @click.stop="$emit('toggleMenu', `org-${org._id}-${repoId}`, $event)"
              ></i>
            </li>
            
            <div v-if="org.repo_ids.length === 0" class="text-center text-muted py-2" style="font-size: 0.8rem">
              No repositories
            </div>
          </ul>
        </transition>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  orgsList: Array,
  expandedOrgs: Object, 
  repoMap: Object,        
  selectedRepo: Object
})

const emit = defineEmits(['openCreateOrg', 'openDeleteOrg', 'openAddMember', 'selectRepo', 'toggleMenu', 'toggleExpand','openManageMembers'])

function toggleExpand(orgId) {
  emit('toggleExpand', orgId)
}
</script>

<style scoped>
.custom-list { list-style: none; padding: 0; margin: 0; }

.custom-list .list-group-item {
  background-color: #303236;
  color: white;
  border: 1px solid transparent !important;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.list-group-item.expanded { border-color: #0d6efd !important; /* Inny kolor dla org (niebieski) */ }

.custom-list > .list-group-item:not(.expanded):hover {
  background-color: #3b3e42 !important;
  border-color: #0d6efd !important;
}

.repo-item:hover { background-color: #3b3e42 !important; }
.repo-item.active { border: 1px solid #0d6efd !important; background-color: #3b3e42 !important; }

.add-btn {
  background: none; color: white; width: 32px; height: 32px; border: none;
  display: flex; justify-content: center; align-items: center; transition: 0.15s;
}
.add-btn:hover { transform: scale(1.08); }

.action-icon { cursor: pointer; opacity: 0.7; transition: 0.2s; }
.action-icon:hover { opacity: 1; transform: scale(1.1); }

/* Kropki */
.dots-icon { opacity: 0; transition: opacity 0.1s ease; }
.repo-item:hover .dots-icon { opacity: 1; }

/* Animacje */
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; overflow: hidden;}
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; }
.slide-enter-to { max-height: 500px; opacity: 1; }
</style>