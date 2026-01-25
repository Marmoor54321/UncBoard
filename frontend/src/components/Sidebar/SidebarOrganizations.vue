<template>
  <div
    class="d-flex flex-column org-root"
    :style="{ flex: isSectionOpen ? '0 10000 auto' : '0 0 auto', minHeight: '0' }"
  >
    <div class="d-flex justify-content-between align-items-center mt-2 mb-2 flex-shrink-0">
      <div
        class="d-flex align-items-center gap-2 section-toggle"
        title="Kliknij, aby zwinąć lub rozwinąć"
        @click="isSectionOpen = !isSectionOpen"
      >
        <i class="bi" :class="isSectionOpen ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
        <h6 class="m-0 transition-colors">Organizations</h6>
      </div>

      <button class="add-btn" @click.stop="$emit('openCreateOrg')">
        <i class="bi bi-plus-lg"></i>
      </button>
    </div>

    <transition name="section-expand">
      <div v-show="isSectionOpen" class="scrollable-list-container">
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
              <span class="text-truncate" style="max-width: 180px">{{ org.name }}</span>
              <i
                class="bi"
                :class="expandedOrgs[org._id] ? 'bi-chevron-down' : 'bi-chevron-right'"
              ></i>
            </div>

            <transition name="slide">
              <ul v-if="expandedOrgs[org._id]" class="list-group nested-list">
                <div
                  class="d-flex justify-content-between px-2 py-1 mb-1 border-bottom border-secondary"
                >
                  <small class="text-white" style="font-size: 0.75rem">
                    Members: {{ org.members.length }}
                  </small>
                  <div class="d-flex gap-2">


                    <div class="d-flex gap-2">
                      <i
                        class="bi bi-chat-dots-fill action-icon text-success"
                        title="Open Chat"
                        @click.stop="$emit('openChat', org)"
                      ></i>
                      <i
                        class="bi bi-people action-icon text-primary"
                        title="Manage Members"
                        @click.stop="$emit('openManageMembers', org)"
                      ></i>
                    </div>
                    <i
                      class="bi bi-trash action-icon text-danger"
                      title="Delete Organization"
                      @click.stop="$emit('openDeleteOrg', org._id)"
                    ></i>
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

                <div
                  v-if="org.repo_ids.length === 0"
                  class="text-center text-white py-2"
                  style="font-size: 0.8rem"
                >
                  No repositories
                </div>
              </ul>
            </transition>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  orgsList: Array,
  expandedOrgs: Object,
  repoMap: Object,
  selectedRepo: Object,
})

const emit = defineEmits([
  'openCreateOrg',
  'openDeleteOrg',
  'openAddMember',
  'selectRepo',
  'toggleMenu',
  'toggleExpand',
  'openManageMembers',
  'openChat',
])

const isSectionOpen = ref(true)

function toggleExpand(orgId) {
  emit('toggleExpand', orgId)
}
</script>

<style scoped>
.custom-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.custom-list .list-group-item {
  background-color: #303236;
  color: white;
  border: 1px solid transparent !important;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.list-group-item.expanded {
  border-color: #aa50e7 !important;
}

.custom-list > .list-group-item:not(.expanded):hover {
  background-color: #3b3e42 !important;
  border-color: #aa50e7 !important;
}

.repo-item:hover {
  background-color: #3b3e42 !important;
}
.repo-item.active {
  border: 1px solid #aa50e7 !important;
  background-color: #3b3e42 !important;
}

.add-btn {
  background: none;
  color: white;
  width: 32px;
  height: 32px;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.15s;
}
.add-btn:hover {
  transform: scale(1.08);
}

.action-icon {
  cursor: pointer;
  opacity: 0.7;
  transition: 0.2s;
}
.action-icon:hover {
  opacity: 1;
  transform: scale(1.1);
}

/* Kropki */
.dots-icon {
  opacity: 0;
  transition: opacity 0.1s ease;
}
.repo-item:hover .dots-icon {
  opacity: 1;
}

/* Animacje wewnętrznej listy */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}
.slide-enter-to {
  max-height: 500px;
  opacity: 1;
}

/* --- SEKCJA ROZWIJANA --- */

.org-root {
  min-height: 0;
  overflow: hidden;
  transition: flex 0.3s ease;
}

.section-toggle {
  cursor: pointer;
  user-select: none;
  color: white;
  transition: color 0.2s ease;
}

.section-toggle h6 {
  color: inherit;
  transition: color 0.2s ease;
}

.section-toggle:hover {
  color: #aa50e7 !important;
}

.scrollable-list-container {
  overflow-y: auto;
  flex-grow: 1;
  min-height: 0;
  padding-bottom: 20px;
  padding-right: 5px;
  scrollbar-width: thin;
  scrollbar-color: #444 #1d1e20;
}

.scrollable-list-container::-webkit-scrollbar {
  width: 6px;
}
.scrollable-list-container::-webkit-scrollbar-track {
  background: transparent;
}
.scrollable-list-container::-webkit-scrollbar-thumb {
  background-color: #444;
  border-radius: 10px;
}

/* Animacja rozwijania całej sekcji */
.section-expand-enter-active,
.section-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
  max-height: 100vh;
}

.section-expand-enter-from,
.section-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.section-expand-enter-to {
  max-height: 100vh;
  opacity: 1;
}
</style>
