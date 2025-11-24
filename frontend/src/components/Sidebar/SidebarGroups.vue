<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mt-4">
      <h6 class="text-white m-0">Your Groups</h6>
      <button class="add-group-btn" @click="$emit('openCreateGroup')">
        <i class="bi bi-plus-lg"></i>
      </button>
    </div>

    <ul class="list-group custom-list">
      <li
        v-for="group in groupsList"
        :key="group._id"
        class="list-group-item"
        :class="{ expanded: expandedGroups[group._id] }"
      >
        <div
          class="d-flex justify-content-between align-items-center"
          @click="toggleExpand(group._id)"
        >
          {{ group.name }}
          <i class="bi" :class="expandedGroups[group._id] ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
        </div>

        <transition name="slide">
          <ul v-if="expandedGroups[group._id]" class="list-group nested-repo-list">
            <li
              v-for="repoId in group.repo_ids"
              :key="repoId"
              class="list-group-item nested-item d-flex justify-content-between align-items-center group-repo-item"
              :class="{ active: selectedRepo && selectedRepo.id === repoId }"
              @click="$emit('selectRepo', repoMap[repoId])"
            >
              <span>{{ repoMap[repoId]?.name || 'Unknown repo' }}</span>
              
              <i
                class="bi bi-three-dots-vertical text-white ms-2"
                @click.stop="$emit('toggleMenu', `group-${group._id}-${repoId}`, $event)"
              ></i>
            </li>

            <div class="delete-group-btn d-flex align-items-center text-danger mt-2">
              <i class="bi bi-trash ms-auto" @click.stop="$emit('openDeleteGroup', group._id)"></i>
            </div>
          </ul>
        </transition>
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({
  groupsList: Array,
  expandedGroups: Object, 
  repoMap: Object,        
  selectedRepo: Object
})

const emit = defineEmits(['openCreateGroup', 'openDeleteGroup', 'selectRepo', 'toggleMenu'])

function toggleExpand(groupId) {
  props.expandedGroups[groupId] = !props.expandedGroups[groupId]
}
</script>

<style scoped>
/* Style specyficzne dla grup przeniesione tutaj */
.custom-list { list-style: none; padding: 0; margin: 0; }
.custom-list .list-group-item { background-color: #303236; color: white; border: none !important; cursor: pointer; }
.custom-list .list-group-item:hover, .group-repo-item:hover {
  background-color: #3b3e42 !important;
}
.active { border: 1px solid #aa50e7 !important; background-color: #3b3e42 !important; }

.add-group-btn {
  background: none; color: white; width: 32px; height: 32px; border: none;
  display: flex; justify-content: center; align-items: center; transition: 0.15s;
}
.add-group-btn:hover { transform: scale(1.08); }

.list-group i.bi-three-dots-vertical { opacity: 0; transition: opacity 0.1s ease; }
.list-group-item:hover i.bi-three-dots-vertical { opacity: 1; }

.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; max-height: 0; }
.slide-enter-to { max-height: 500px; opacity: 1; }
</style>