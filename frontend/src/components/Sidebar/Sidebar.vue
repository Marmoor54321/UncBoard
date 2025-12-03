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
        @open-create-group="showModalCreateGroup = true"
        @open-delete-group="openDeleteGroupModal"
        @select-repo="selectRepo"
        @toggle-menu="toggleMenu"
        @toggle-expand="onToggleGroupExpand"
      />

      <SidebarRepositories
        :repos="repos"
        :selected-repo="selectedRepo"
        @select-repo="selectRepo"
        @toggle-menu="toggleMenu"
      />
    </div>

    <SidebarModals
      :show-create="showModalCreateGroup"
      :show-delete="showModalDeleteGroup"
      @close-create="showModalCreateGroup = false"
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
import SidebarModals from './SidebarModals.vue'
import SidebarContextMenus from './SidebarContextMenus.vue'
import SidebarProfile from './SidebarProfile.vue'
import SidebarGroups from './SidebarGroups.vue'
import SidebarRepositories from './SidebarRepositories.vue'

// --- PROPS & EMITS ---
const emit = defineEmits(['addRepoToGroup', 'deleteRepoFromGroup', 'addGroup', 'deleteGroup'])
const props = defineProps({
  user: Object,
  repos: Array,
  selectedRepo: Object,
  loginWithGithub: Function,
  selectRepo: Function,
  groupsList: Array,
  // USUNIĘTO: expandedGroups z props, ponieważ Sidebar powinien zarządzać tym stanem
})

const repoMap = computed(() => Object.fromEntries(props.repos.map((r) => [r.id, r])))

// --- LOKALNY STAN: EXPANDED GROUPS ---
// Tworzymy reaktywny obiekt do przechowywania stanu otwartych grup
const expandedGroups = reactive({})

function onToggleGroupExpand(groupId) {
  // Tutaj bezpiecznie zmieniamy stan lokalny
  expandedGroups[groupId] = !expandedGroups[groupId]
}

// --- RESZTA LOGIKI BEZ ZMIAN ---
const activeMenu = ref(null)
const activePicker = ref(null)
const menuRepoId = ref(null)
const menuGroupId = ref(null)
const pickerRepo = ref(null)
const pickerGroup = ref(null)
const menuStyle = ref({ top: '0px', left: '0px', position: 'fixed', zIndex: 9999 })
const pickerStyle = ref({ top: '0px', left: '0px', position: 'fixed', zIndex: 9999 })
let lastMenuEventTarget = null 

const showModalCreateGroup = ref(false)
const showModalDeleteGroup = ref(false)
const groupToDeleteId = ref(null)

function handleCreateGroup(name) {
  emit('addGroup', { name, created_by: props.user._id })
  showModalCreateGroup.value = false
}

function openDeleteGroupModal(groupId) {
  groupToDeleteId.value = groupId
  showModalDeleteGroup.value = true
}

function closeModalDeleteGroup() {
  showModalDeleteGroup.value = false
  groupToDeleteId.value = null
}

function onConfirmDeleteGroup() {
  if (groupToDeleteId.value) {
    emit('deleteGroup', { groupId: groupToDeleteId.value })
  }
  closeModalDeleteGroup()
}

function toggleMenu(id, event) {
  if (activeMenu.value === id) {
    closeMenu()
    return
  }
  activeMenu.value = id
  activePicker.value = null
  lastMenuEventTarget = event.target 

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

function onPickerSelect(groupId) {
  emit('addRepoToGroup', { repoId: pickerRepo.value, groupId })
  closeMenu()
}

function onDeleteFromGroupForMenu() {
  emit('deleteRepoFromGroup', { repoId: menuRepoId.value, groupId: menuGroupId.value })
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