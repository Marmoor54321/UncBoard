<template>
  <aside
    class="sidebar-container border-end p-3 offcanvas-lg offcanvas-start"
    tabindex="-1"
    style="scrollbar-color: #303236 #1d1e20"
  >
    <SidebarProfile 
      :user="user" 
      @login="loginWithGithub" 
    />

    <div v-if="user">
      <SidebarGroups
        :groups-list="groupsList"
        :expanded-groups="expandedGroups"
        :repo-map="repoMap"
        :selected-repo="selectedRepo"
        @open-create-group="modals.createGroup = true"
        @open-delete-group="(id) => { modals.deleteGroup = true; modals.groupId = id }"
        @select-repo="handleSelectRepo"
        @toggle-expand="toggleGroupExpand"
        @toggle-menu="toggleMenu"
      />

      <SidebarRepositories
        :repos="repos"
        :selected-repo="selectedRepo"
        @select-repo="handleSelectRepo"
        @toggle-menu="toggleMenu"
      />
    </div>

    <SidebarModals
      :show-create="modals.createGroup"
      :show-delete="modals.deleteGroup"
      @close-create="modals.createGroup = false"
      @confirm-create="handleCreateGroup"
      @close-delete="closeModalDeleteGroup"
      @confirm-delete="onConfirmDeleteGroup"
    />

    <SidebarContextMenus
      :active-menu="activeMenu"
      :menu-style="menuStyle"
      :active-picker="activePicker"
      :picker-style="pickerStyle"
      :groups-list="groupsList"
      @open-picker="openPickerFromMenu"
      @close-picker="closePicker"
      @keep-picker-open="keepPickerOpen"
      @delete-from-group="onDeleteFromGroupForMenu"
      @picker-select="onPickerSelect" 
    />
  </aside>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { useGroups } from '@/composables/useGroups.js'
import { useKanban } from '@/composables/useKanban.js'

import SidebarModals from './SidebarModals.vue'
import SidebarContextMenus from './SidebarContextMenus.vue'
import SidebarProfile from './SidebarProfile.vue'
import SidebarGroups from './SidebarGroups.vue'
import SidebarRepositories from './SidebarRepositories.vue'

const router = useRouter()

const { user, loginWithGithub } = useAuth()

const { 
  groupsList, 
  handleAddGroup, 
  handleDeleteGroup, 
  handleAddRepoToGroup, 
  handleDeleteRepoFromGroup 
} = useGroups(user)

const { repos, selectedRepo, selectRepo } = useKanban()

const emit = defineEmits(['addRepoToGroup', 'deleteRepoFromGroup', 'addGroup', 'deleteGroup'])

const repoMap = computed(() => Object.fromEntries(repos.value.map((r) => [r.id, r])))
const modals = reactive({ createGroup: false, deleteGroup: false, groupId: null })
const expandedGroups = reactive({})

// --- HANDLERS ---

function handleSelectRepo(repo) {
  selectRepo(repo)
  router.push({ name: 'repo-board', params: { owner: repo.owner.login, repo: repo.name } })
}

function toggleGroupExpand(groupId) {
  expandedGroups[groupId] = !expandedGroups[groupId]
}

function handleCreateGroup(name) {
  handleAddGroup({ name, created_by: user.value._id })
  modals.createGroup = false
}

async function onPickerSelect(groupId) {
  // pickerRepo.value jest ustawiane w momencie otwierania menu (openPickerFromMenu)
  if (pickerRepo.value && groupId) {
    await handleAddRepoToGroup({ 
      repoId: pickerRepo.value, 
      groupId: groupId 
    })
  }
  closeMenu()
}

function closeModalDeleteGroup() {
  modals.deleteGroup = false
  modals.groupId = null
}

function onConfirmDeleteGroup() {
  if (modals.groupId) {
    handleDeleteGroup({ groupId: modals.groupId })
  }
  closeModalDeleteGroup()
}

// --- CONTEXT MENU LOGIC ---
const activeMenu = ref(null)
const activePicker = ref(null)
const menuRepoId = ref(null)
const menuGroupId = ref(null)
const pickerRepo = ref(null)
const pickerGroup = ref(null)
const menuStyle = ref({ top: '0px', left: '0px', position: 'fixed', zIndex: 9999 })
const pickerStyle = ref({ top: '0px', left: '0px', position: 'fixed', zIndex: 9999 })

function toggleMenu(id, event) {
  if (activeMenu.value === id) {
    closeMenu()
    return
  }
  activeMenu.value = id
  activePicker.value = null
  
  const rect = event.target.getBoundingClientRect()
  const windowHeight = window.innerHeight
  const estimatedMenuHeight = 120
  const spaceBelow = windowHeight - rect.bottom

  let newStyle = { position: 'fixed', left: rect.right + 12 + 'px', zIndex: 9999, top: rect.top + 'px', bottom: 'auto' }

  if (spaceBelow < estimatedMenuHeight) {
    newStyle.top = 'auto'
    newStyle.bottom = windowHeight - rect.top - 30 + 'px'
  }
  menuStyle.value = newStyle

  // Parsowanie ID
  if (id.startsWith('repo-')) {
    menuRepoId.value = parseInt(id.split('-')[1])
    menuGroupId.value = null
  } else {
    const parts = id.split('-')
    menuGroupId.value = parts[1]
    menuRepoId.value = parts[2]
  }
}

function closeMenu() {
  activeMenu.value = null
  activePicker.value = null
}

function openPickerFromMenu(event) {
  if (!event || !event.target) return;
  activePicker.value = 'picker'
  
  // Ustawiamy ID repozytorium, które chcemy dodać
  pickerRepo.value = menuRepoId.value
  pickerGroup.value = menuGroupId.value

  const rect = event.target.getBoundingClientRect()
  const windowHeight = window.innerHeight
  const estimatedPickerHeight = 250
  const spaceBelow = windowHeight - rect.top

  let newStyle = {
    position: 'fixed',
    left: (rect.right + 4) + 'px', 
    zIndex: 10000, 
    top: rect.top + 'px',
    bottom: 'auto',
  }

  if (spaceBelow < estimatedPickerHeight) {
    newStyle.top = 'auto'
    newStyle.bottom = (windowHeight - rect.bottom) + 'px'
  }
  pickerStyle.value = newStyle
}

function keepPickerOpen() {}
function closePicker() { activePicker.value = null }

function onDeleteFromGroupForMenu() {
  handleDeleteRepoFromGroup({ 
    repoId: menuRepoId.value, 
    groupId: menuGroupId.value 
  })
  closeMenu()
}

function handleClickOutside(e) {
  if (!e.target.closest('.popup')) closeMenu()
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.sidebar-container {
  background-color: #1d1e20; 
  height: 94vh; 
  width: 340px; 
  min-width: 340px;
  overflow-y: auto; 
  overflow-x: hidden; 
  scrollbar-gutter: stable;
}
</style>