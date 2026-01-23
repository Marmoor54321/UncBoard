<template>
  <aside
    class="sidebar-container p-3 offcanvas-lg offcanvas-start"
    tabindex="-1"
    style="scrollbar-color: #303236 #1d1e20"
  >
    <SidebarProfile 
      :user="user" 
      @login="loginWithGithub" 
    />

    <div v-if="user">
      <SidebarOrganizations
        :orgs-list="orgsList"
        :expanded-orgs="expandedOrgs"
        :repo-map="repoMap"
        :selected-repo="selectedRepo"
        @open-create-org="modals.createOrg = true"
        @open-add-member="(id) => { modals.addMember = true; modals.orgId = id }"
        @open-delete-org="openDeleteOrgModal"
        @select-repo="handleSelectRepo"
        @toggle-expand="toggleOrgExpand"
        @toggle-menu="toggleMenu"
      />
      
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
    <SidebarOrgModals
      :show-create="modals.createOrg"
      :show-add-member="modals.addMember"
      :show-delete="modals.deleteOrg" 
      @close-create="modals.createOrg = false"
      @confirm-create="handleCreateOrg"
      @close-add-member="modals.addMember = false"
      @confirm-add-member="handleAddMember"
      @close-delete="closeModalDeleteOrg"
      @confirm-delete="onConfirmDeleteOrg"
    />

    <SidebarContextMenus
      :active-menu="activeMenu"
      :menu-style="menuStyle"
      :active-picker="activePicker"
      :picker-style="pickerStyle"
      :groups-list="groupsList"
      :orgs-list="orgsList"
      @open-picker="openPickerFromMenu"
      @close-picker="closePicker"
      @keep-picker-open="keepPickerOpen"
      @delete-from-context="onDeleteFromContext"
      @picker-select="onPickerSelect" 
    />
  </aside>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth.js'
import { useGroups } from '@/composables/useGroups.js'
import { useKanban } from '@/composables/useKanban.js'
import { useOrganizations } from '@/composables/useOrganizations.js'

import SidebarModals from './SidebarModals.vue'
import SidebarContextMenus from './SidebarContextMenus.vue'
import SidebarProfile from './SidebarProfile.vue'
import SidebarGroups from './SidebarGroups.vue'
import SidebarRepositories from './SidebarRepositories.vue'
import SidebarOrgModals from './SidebarOrgModals.vue'
import SidebarOrganizations from './SidebarOrganizations.vue'

const router = useRouter()
const { user, loginWithGithub } = useAuth()
const { repos, selectedRepo, selectRepo } = useKanban()

// --- COMPOSABLES ---
const { 
  groupsList, 
  handleAddGroup, 
  handleDeleteGroup, 
  handleAddRepoToGroup, 
  handleDeleteRepoFromGroup 
} = useGroups(user)

const { 
  orgsList, loadOrganizations, createOrganization, deleteOrganization, 
  addRepoToOrganization, removeRepoFromOrganization, addMemberToOrganization 
} = useOrganizations(user)

// --- STATE ---
const repoMap = computed(() => Object.fromEntries(repos.value.map((r) => [r.id, r])))
const modals = reactive({ 
  createGroup: false, deleteGroup: false, groupId: null,
  createOrg: false, addMember: false, orgId: null, deleteOrg: false
})
const expandedGroups = reactive({})
const expandedOrgs = reactive({})

// Init
watch(user, async (newUser) => {
  if (newUser) {
    await loadOrganizations()
  }
}, { immediate: true })

// --- HANDLERS ---
function handleSelectRepo(repo) {
  selectRepo(repo)
  router.push({ name: 'repo-board', params: { owner: repo.owner.login, repo: repo.name } })
}

// Grupy
function toggleGroupExpand(groupId) { expandedGroups[groupId] = !expandedGroups[groupId] }
function handleCreateGroup(name) { handleAddGroup({ name, created_by: user.value._id }); modals.createGroup = false }
function closeModalDeleteGroup() { modals.deleteGroup = false; modals.groupId = null }
function onConfirmDeleteGroup() { if (modals.groupId) handleDeleteGroup({ groupId: modals.groupId }); closeModalDeleteGroup() }

// Organizacje
function toggleOrgExpand(orgId) { expandedOrgs[orgId] = !expandedOrgs[orgId] }
function handleCreateOrg(data) { createOrganization(data); modals.createOrg = false }
function handleAddMember(data) {
  if(modals.orgId) addMemberToOrganization({ orgId: modals.orgId, userLogin: data.login, role: data.role })
  modals.addMember = false
}

// Handlery dla organizacji
function openDeleteOrgModal(id) {
  modals.orgId = id;
  modals.deleteOrg = true;
}

function closeModalDeleteOrg() {
  modals.deleteOrg = false;
  modals.orgId = null;
}

async function onConfirmDeleteOrg() {
  if (modals.orgId) {
    await deleteOrganization(modals.orgId);
    closeModalDeleteOrg();
  }
}

// --- CONTEXT MENU LOGIC ---
const activeMenu = ref(null)
const activePicker = ref(null)
const menuStyle = ref({})
const pickerStyle = ref({})

// Context State: Trzymamy informacje co dokładnie kliknięto
const menuContext = reactive({ 
  type: null, // 'repo', 'group', 'org'
  containerId: null, // ID grupy lub organizacji (jeśli dotyczy)
  repoId: null // ID klikniętego repozytorium
})

function toggleMenu(id, event) {
  if (activeMenu.value === id) { closeMenu(); return }
  
  // Format ID: 'prefix-containerId-repoId' lub 'repo-repoId'
  const parts = id.split('-')
  
  if (id.startsWith('repo-')) {
    // Kliknięto w głównej liście repozytoriów
    menuContext.type = 'repo'
    menuContext.containerId = null
    menuContext.repoId = parseInt(parts[1])
  } else if (id.startsWith('group-')) {
    // Kliknięto repo wewnątrz grupy
    menuContext.type = 'group'
    menuContext.containerId = parts[1]
    menuContext.repoId = parseInt(parts[2])
  } else if (id.startsWith('org-')) {
    // Kliknięto repo wewnątrz organizacji
    menuContext.type = 'org'
    menuContext.containerId = parts[1]
    menuContext.repoId = parseInt(parts[2])
  }

  activeMenu.value = id
  activePicker.value = null
  
  // Pozycjonowanie
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
}

function closeMenu() { activeMenu.value = null; activePicker.value = null }

function openPickerFromMenu(event) {
  if (!event || !event.target) return;
  activePicker.value = 'picker'

  // Pozycjonowanie Pickera
  const rect = event.target.getBoundingClientRect()
  const windowHeight = window.innerHeight
  const estimatedPickerHeight = 250
  const spaceBelow = windowHeight - rect.top

  let newStyle = { position: 'fixed', left: (rect.right + 4) + 'px', zIndex: 10000, top: rect.top + 'px', bottom: 'auto' }
  if (spaceBelow < estimatedPickerHeight) {
    newStyle.top = 'auto'
    newStyle.bottom = (windowHeight - rect.bottom) + 'px'
  }
  pickerStyle.value = newStyle
}

function keepPickerOpen() {}
function closePicker() { activePicker.value = null }

// AKCJA: Wybór elementu z Pickera (Dodawanie do grupy/org)
async function onPickerSelect({ id, type }) {
  const repoToAdd = menuContext.repoId

  if (repoToAdd && id) {
    if (type === 'group') {
      await handleAddRepoToGroup({ repoId: repoToAdd, groupId: id })
    } else if (type === 'org') {
      await addRepoToOrganization({ repoId: repoToAdd, orgId: id })
    }
  }
  closeMenu()
}

// AKCJA: Usuwanie z obecnego kontekstu (z grupy lub z org)
function onDeleteFromContext() {
  const { type, containerId, repoId } = menuContext
  
  if (type === 'group') {
    handleDeleteRepoFromGroup({ repoId, groupId: containerId })
  } else if (type === 'org') {
    removeRepoFromOrganization({ repoId, orgId: containerId })
  }
  closeMenu()
}

// Zamykanie przy kliknięciu poza
function handleClickOutside(e) { if (!e.target.closest('.popup')) closeMenu() }
onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
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