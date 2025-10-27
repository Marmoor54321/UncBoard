<template>
  <div class="container-fluid vh-100 d-flex flex-column p-0" style="background-color: #1d1e20">
    <!-- HEADER -->
    <header
      class="text-white p-3 d-flex justify-content-between align-items-center"
      style="background-color: #303236"
    >
      <button
        class="btn btn-dark d-lg-none"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#sidebarOffcanvas"
        aria-controls="sidebarOffcanvas"
      >
        <i class="bi bi-list"></i>
      </button>

      <h1 class="m-0 fs-3">uncBoard</h1>

      <div class="d-lg-none" style="width: 40px"></div>

      <h1 class="m-0 fs-3">uncBoard</h1>
    </header>

    <div class="flex-grow-1 d-flex overflow-hidden">
      <!-- LEWY PANEL -->
      <aside
        class="border-end p-3 offcanvas-lg offcanvas-start"
        style="
          background-color: #1d1e20;
          width: 20%;
          min-width: 250px;
          max-width: 350px;
          overflow-y: auto;
          scrollbar-color: #303236 #1d1e20;
        "
        tabindex="-1"
        id="sidebarOffcanvas"
        aria-labelledby="sidebarOffcanvasLabel"
      >
        <div v-if="!user" class="text-center mt-4 text-white">
          <button class="btn btn-dark" @click="loginWithGithub">
            <i class="bi bi-github me-2"></i> Login with GitHub
          </button>
        </div>

        <div v-else>
          <div class="text-center mb-4 text-white">
            <img :src="user.avatar_url" class="rounded-circle mb-2" width="80" />
            <h5>{{ user.login }}</h5>
          </div>

          <h6 class="text-white">Your Repositories</h6>
          <ul class="list-group custom-list">
            <li
              v-for="repo in repos"
              :key="repo.id"
              @click="selectRepo(repo)"
              class="list-group-item list-group-item-action"
              :class="{ active: selectedRepo && selectedRepo.id === repo.id }"
            >
              {{ repo.name }}
            </li>
          </ul>
        </div>
      </aside>

      <!-- PRAWA CZĘŚĆ (KANBAN BOARD) -->
      <main
        ref="scrollContainer"
        class="flex-grow-1 p-4 overflow-auto"
        style="scrollbar-color: #303236 #1d1e20; min-width: 0"
      >
        <div v-if="!selectedRepo" class="text-center text-white mt-5">
          <h4>Select a repository to view its issues</h4>
        </div>

        <div v-else>
          <h3 class="mb-4 text-white">
            Issues for <span class="text-primary">{{ selectedRepo.name }}</span>
          </h3>

          <!-- KANBAN BOARD -->
          <div class="row row-cols-1 row-cols-lg-2 row-cols-xl-4 g-3">
            <!-- TODO -->
            <div class="col">
              <div class="card h-100" style="border: 1px solid #aa50e7">
                <div class="card-header bg-dark text-white text-uppercase small">TODO</div>
                <div class="card-body rounded-bottom-1" style="background-color: #303236">
                  <draggable
                    v-model="issuesTODO"
                    :group="groups"
                    item-key="id"
                    animation="200"
                    ghost-class="ghost"
                    chosen-class="chosen"
                    @end="onDragEnd"
                    class="dropzone"
                    :scroll="scrollContainer"
                    :scrollSensitivity="100"
                    :scrollSpeed="15"
                  >
                    <template #item="{ element }">
                      <div class="issuebox mb-2 p-2 rounded">
                        <div class="issuetitle">
                          <strong>{{ element.title }}</strong>
                        </div>
                        <div class="issuebody small">{{ element.body }}</div>
                      </div>
                    </template>
                  </draggable>
                </div>
              </div>
            </div>

            <!-- IN PROGRESS -->
            <div class="col">
              <div class="card h-100" style="border: 1px solid #aa50e7">
                <div class="card-header bg-dark text-white text-uppercase small">IN PROGRESS</div>
                <div class="card-body rounded-bottom-1" style="background-color: #303236">
                  <draggable
                    v-model="issuesINPROGRESS"
                    :group="groups"
                    item-key="id"
                    animation="200"
                    ghost-class="ghost"
                    chosen-class="chosen"
                    @end="onDragEnd"
                    class="dropzone"
                    :scroll="scrollContainer"
                    :scrollSensitivity="100"
                    :scrollSpeed="15"
                  >
                    <template #item="{ element }">
                      <div class="issuebox mb-2 p-2 rounded">
                        <div class="issuetitle">
                          <strong>{{ element.title }}</strong>
                        </div>
                        <div class="issuebody small">{{ element.body }}</div>
                      </div>
                    </template>
                  </draggable>
                </div>
              </div>
            </div>

            <!-- IN REVIEW -->
            <div class="col">
              <div class="card h-100" style="border: 1px solid #aa50e7">
                <div class="card-header bg-dark text-white text-uppercase small">IN REVIEW</div>
                <div class="card-body rounded-bottom-1" style="background-color: #303236">
                  <draggable
                    v-model="issuesINREVIEW"
                    :group="groups"
                    item-key="id"
                    animation="200"
                    ghost-class="ghost"
                    chosen-class="chosen"
                    @end="onDragEnd"
                    class="dropzone"
                    :scroll="scrollContainer"
                    :scrollSensitivity="100"
                    :scrollSpeed="15"
                  >
                    <template #item="{ element }">
                      <div class="issuebox mb-2 p-2 rounded">
                        <div class="issuetitle">
                          <strong>{{ element.title }}</strong>
                        </div>
                        <div class="issuebody small">{{ element.body }}</div>
                      </div>
                    </template>
                  </draggable>
                </div>
              </div>
            </div>

            <!-- DONE -->
            <div class="col">
              <div class="card h-100" style="border: 1px solid #aa50e7">
                <div class="card-header bg-dark text-white text-uppercase small">DONE</div>
                <div class="card-body rounded-bottom-1" style="background-color: #303236">
                  <draggable
                    v-model="issuesDONE"
                    :group="groups"
                    item-key="id"
                    animation="200"
                    ghost-class="ghost"
                    chosen-class="chosen"
                    @end="onDragEnd"
                    class="dropzone"
                    :scroll="scrollContainer"
                    :scrollSensitivity="100"
                    :scrollSpeed="15"
                  >
                    <template #item="{ element }">
                      <div class="issuebox mb-2 p-2 rounded">
                        <div class="issuetitle">
                          <strong>{{ element.title }}</strong>
                        </div>
                        <div class="issuebody small">{{ element.body }}</div>
                      </div>
                    </template>
                  </draggable>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import axios from 'axios'
import { ref, onMounted } from 'vue'
import draggable from 'vuedraggable'

const user = ref(null)
const repos = ref([])
const selectedRepo = ref(null)
const scrollContainer = ref(null)

const issuesTODO = ref([])
const issuesINPROGRESS = ref([{ id: 3, title: 'Testowanie', body: 'Jednostkowe testy' }])
const issuesINREVIEW = ref([])
const issuesDONE = ref([])

// GitHub login
function loginWithGithub() {
  window.location.href = 'http://localhost:3000/auth/github'
}

// Load GitHub user
async function loadUser() {
  try {
    const res = await axios.get('http://localhost:3000/api/github/user', {
      withCredentials: true,
    })
    user.value = res.data
    await loadRepos()
  } catch {
    console.log('Not logged in')
  }
}
// Ustawienia grupy drag&drop
const groups = {
  name: 'issues',
  pull: true,
  put: true,
}

// Event po zakończeniu przeciągania (np. update do backendu)
function onDragEnd(event) {
  console.log('Przeniesiono issue:', event.item)
}

// Load repos
async function loadRepos() {
  const res = await axios.get('http://localhost:3000/api/github/repos', {
    withCredentials: true,
  })
  repos.value = res.data
}

// Load issues for repo
async function selectRepo(repo) {
  selectedRepo.value = repo
  issuesTODO.value = []
  try {
    const res = await axios.get(
      `http://localhost:3000/api/github/issues/${repo.owner.login}/${repo.name}`,
      { withCredentials: true },
    )
    issuesTODO.value = res.data
  } catch (err) {
    console.error('Error loading issues:', err)
  }
}

onMounted(loadUser)
</script>

<style scoped>
.dropzone {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
}

.issuebox {
  background-color: #3b3e42;
  color: white;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
  cursor: grab;
}
.issuebox:hover {
  background-color: #50545b;
}
.chosen {
  background-color: #aa50e7 !important;
  transform: scale(1.05);
}
.ghost {
  opacity: 1;
}
.issuebody {
  margin-top: 5px;
  font-size: 14px;
  color: #d1d1d1;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: break-word;
}

.custom-list .list-group-item {
  background-color: #303236;
  color: white;
  border: none !important;

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-list .list-group-item:hover {
  border: 1px solid #aa50e7 !important;
  background-color: #3b3e42 !important;
  color: white;
}

.custom-list .list-group-item.active {
  border: 2px solid #aa50e7 !important;
  background-color: #3b3e42 !important;
}
</style>
