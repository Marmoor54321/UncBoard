<template>
  <div class="mt-4">
    <h6 class="text-white">Your Repositories</h6>
    
    <div class="mb-3 mt-2 position-relative">
      <input
        v-model="searchQuery"
        type="text"
        class="search-input w-100"
        placeholder="Search repositories..."
      />
    </div>

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
      
      <div v-if="filteredRepos.length === 0 && searchQuery" class="text-center text-white-50 mt-3">
           No repositories found.
      </div>
    </ul>
  </div>
</template>

<script setup>
import { ref, watch, computed, onBeforeUnmount } from 'vue'

const props = defineProps({
  repos: {
    type: Array,
    default: () => []
  },
  selectedRepo: Object
})

const emit = defineEmits(['selectRepo', 'toggleMenu'])

// --- LOGIKA WYSZUKIWANIA ---
const searchQuery = ref('')
const debouncedQuery = ref('')
let searchTimeout = null

watch(searchQuery, (newValue) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { debouncedQuery.value = newValue }, 500)
})

const filteredRepos = computed(() => {
  if (!debouncedQuery.value.trim()) return props.repos
  const term = debouncedQuery.value.toLowerCase()
  return props.repos.filter((repo) => repo.name.toLowerCase().includes(term))
})

onBeforeUnmount(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
})
</script>

<style scoped>
.search-input {
  background: #1f2023; border: 1px solid #555; color: white; padding: 8px 12px;
  border-radius: 6px; outline: none; transition: border-color 0.2s;
}
.search-input:focus { border-color: #aa50e7; }

.custom-list { list-style: none; padding: 0; margin: 0; }

.custom-list .list-group-item {
  background-color: #303236;
  color: white;
  border: 1px solid transparent !important;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
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

.list-move, .list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; max-height: 0; }
</style>