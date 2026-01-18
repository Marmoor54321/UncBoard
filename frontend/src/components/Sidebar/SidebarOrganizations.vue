<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mt-4">
      <h6 class="text-white m-0">Organizations</h6>
      </div>

    <ul class="list-group custom-list mt-2">
      <li
        v-for="org in organizations"
        :key="org.id"
        class="list-group-item"
        :class="{ expanded: expandedOrgs[org.login] }"
      >
        <div
          class="d-flex justify-content-between align-items-center group-header"
          @click="toggleExpand(org.login)"
        >
          <div class="d-flex align-items-center gap-2">
             <img :src="org.avatar_url" width="20" height="20" class="rounded-circle" alt="org">
            <span>{{ org.login }}</span>
          </div>
          <i class="bi" :class="expandedOrgs[org.login] ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
        </div>

        <transition name="slide">
          <ul v-if="expandedOrgs[org.login]" class="list-group nested-repo-list">
            <i 
              class="bi bi-chat-dots-fill chat-icon ms-2" 
              title="Open Organization Chat"
              @click.stop="$emit('openChat', org)"
            ></i>
            
            <li v-if="!orgRepos[org.login]" class="list-group-item text-muted small fst-italic ps-4">
              Loading repos...
            </li>
            
            <li v-else-if="orgRepos[org.login].length === 0" class="list-group-item text-muted small ps-4">
              No repositories found.
            </li>

            <li
              v-else
              v-for="repo in orgRepos[org.login]"
              :key="repo.id"
              class="list-group-item nested-item d-flex justify-content-between align-items-center group-repo-item"
              :class="{ active: selectedRepo && selectedRepo.id === repo.id }"
              @click="$emit('selectRepo', repo)"
            >
              <span class="text-truncate">{{ repo.name }}</span>
            </li>
          </ul>
        </transition>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  organizations: Array,
  orgRepos: Object,     // Struktura: { 'nazwa-org': [repo1, repo2] }
  expandedOrgs: Object, // Struktura: { 'nazwa-org': true/false }
  selectedRepo: Object
})

const emit = defineEmits(['toggleExpand', 'selectRepo', 'openChat'])

function toggleExpand(orgLogin) {
  emit('toggleExpand', orgLogin)
}
</script>

<style scoped>
/* Te same style co w SidebarGroups dla spójności */
.custom-list { list-style: none; padding: 0; margin: 0; }

.custom-list .list-group-item {
  background-color: #303236;
  color: white;
  border: 1px solid transparent !important;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.list-group-item.expanded {
   border-color: #aa50e7 !important;
}

.custom-list > .list-group-item:not(.expanded):hover {
  background-color: #3b3e42 !important;
  border-color: #aa50e7 !important;
}

/* Style dla zagnieżdżonych repozytoriów */
.group-repo-item:hover {
  background-color: #3b3e42 !important;
  border-color: #aa50e7 !important;
}

.group-repo-item.active { 
  border: 1px solid #aa50e7 !important; 
  background-color: #3b3e42 !important; 
}

/* Animacje */
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; overflow: hidden;}
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; }
.slide-enter-to { max-height: 500px; opacity: 1; }

.chat-icon {
  color: #6c757d;
  transition: color 0.2s, transform 0.2s;
}
.chat-icon:hover {
  color: #aa50e7 !important;
  transform: scale(1.2);
}
</style>