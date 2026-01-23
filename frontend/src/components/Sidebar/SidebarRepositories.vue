<template>
  <div class="d-flex flex-column repo-root" :style="{ flex: isSectionOpen ? '1' : '0 auto' }">
    <div
      class="d-flex align-items-center gap-2 mb-2 mt-4 flex-shrink-0 section-toggle"
      title="Kliknij, aby zwinąć lub rozwinąć"
      @click="isSectionOpen = !isSectionOpen"
    >
      <i class="bi" :class="isSectionOpen ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
      <h6 class="m-0 transition-colors">Your Repositories</h6>
    </div>

    <div v-show="isSectionOpen" class="scrollable-list-container">
      <ul class="list-group custom-list">
        <TransitionGroup name="list">
          <li
            v-for="repo in filteredRepos"
            :key="repo.id"
            class="list-group-item d-flex justify-content-between align-items-center repo-item"
            :class="{ active: selectedRepo && selectedRepo.id === repo.id }"
            @click="$emit('selectRepo', repo)"
          >
            <span>{{ repo.name }}</span>
            <i
              class="bi bi-three-dots-vertical text-white ms-2"
              @click.stop="$emit('toggleMenu', `repo-${repo.id}`, $event)"
            ></i>
          </li>
        </TransitionGroup>

        <div
          v-if="filteredRepos.length === 0 && searchQuery"
          class="text-center text-white-50 mt-3"
        >
          No repositories found.
        </div>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  repos: {
    type: Array,
    default: () => [],
  },
  selectedRepo: Object,
  searchQuery: String,
})

defineEmits(['selectRepo', 'toggleMenu'])

const isSectionOpen = ref(true)

const filteredRepos = computed(() => {
  if (!props.searchQuery || !props.searchQuery.trim()) return props.repos

  const term = props.searchQuery.toLowerCase()
  return props.repos.filter((repo) => repo.name.toLowerCase().includes(term))
})
</script>

<style scoped>
.search-input {
  background: #1f2023;
  border: 1px solid #555;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus {
  border-color: #aa50e7;
}

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

/* --- STYL DLA REPOZYTORIUM --- */

.repo-item:hover {
  background-color: #3b3e42 !important;
  border-color: #aa50e7 !important;
}

.repo-item.active {
  border: 1px solid #aa50e7 !important;
  background-color: #3b3e42 !important;
}

/* --- TRZY KROPKI --- */
.repo-item .bi-three-dots-vertical {
  opacity: 0;
  transition: opacity 0.1s ease;
}
.repo-item:hover .bi-three-dots-vertical {
  opacity: 1;
}

.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  max-height: 0;
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
  padding-bottom: 40px;
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

.repo-root {
  min-height: 0;
  overflow: hidden;
  transition: flex 0.3s ease;
}

.scrollable-list-container {
  overflow-y: auto;
  flex-grow: 1;
  height: 100%;

  padding-bottom: 60px;
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
</style>
