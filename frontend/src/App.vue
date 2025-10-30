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
            <!--Kanban board-->
            <div class="row row-cols-1 row-cols-lg-2 row-cols-xl-4 g-3">
              <div v-for="col in columns" :key="col" class="col">
                <div class="card h-100" style="border: 1px solid #aa50e7">
                  <div class="card-header bg-dark text-white text-uppercase small">
                    {{ col }}
                  </div>
                  <div class="card-body rounded-bottom-1" style="background-color: #303236">
                    <draggable
                      v-model="issuesByColumn[col]"
                      :group="groups"
                      item-key="id"
                      animation="200"
                      @end="onDragEnd"
                      class="dropzone"
                    >
                      <template #item="{ element }">
                        <div
                          class="issuebox mb-2 p-2 rounded"
                          :data-item-id="element.projectItemId"
                        >
                          <strong>{{ element.title }}</strong>
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
const currentProjectId = ref(null);
const fieldOptionsMap = ref({});
const statusFieldId = ref(null);


// const issuesTODO = ref([])
// const issuesINPROGRESS = ref([{ id: 3, title: 'Testowanie', body: 'Jednostkowe testy' }])
// const issuesINREVIEW = ref([])
// const issuesDONE = ref([])

const columns = ref([])
const issuesByColumn = ref({})

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
async function onDragEnd(event) {
  const movedIssue = event.item;
  const newColumn = event.to?.closest('.card')?.querySelector('.card-header')?.innerText.trim();

  const normalizedColumn = newColumn.toLowerCase().trim().replaceAll("_", " ");
  const optionId = fieldOptionsMap.value[normalizedColumn];


  if (!optionId) {
    console.error("Missing optionId for column", newColumn);
    return;
  }

  try {
    const itemId = movedIssue.dataset.itemId;

    const res = await axios.post(
      "http://localhost:3000/api/github/update-item",
      {
        projectId: currentProjectId.value,
        itemId,
        fieldId: statusFieldId.value,
        optionId,
      },
      { withCredentials: true }
    );

  } catch (err) {
    console.error("GitHub update failed:", err.response?.data || err.message);
  }
}


// Load repos
async function loadRepos() {
  const res = await axios.get('http://localhost:3000/api/github/repos', {
    withCredentials: true,
  })
  repos.value = res.data
}


// const currentProject = ref(null);
// const statusField = ref(null);
// const fieldOptionsMap = ref({});

// Load issues for repo (with columns)
async function selectRepo(repo) {
  selectedRepo.value = repo;

  const res = await axios.get(
    `http://localhost:3000/api/github/project-items/${repo.owner.login}/${repo.name}`,
    { withCredentials: true }
  );

  const project = res.data.data.repository.projectsV2.nodes[0];
  currentProjectId.value = project.id;

  const fields = project.fields.nodes;

  const statusField = fields.find(f => f.options && f.options.length);
  statusFieldId.value = statusField?.id;

  fieldOptionsMap.value = {};
  columns.value = [];

  if (statusField) {
    statusField.options.forEach(o => {
      const normalized = o.name.toLowerCase().trim().replaceAll("_", " ");
      fieldOptionsMap.value[normalized] = o.id;
      columns.value.push(o.name);
    });
  }

  // "no status" column for unassigned issues
  if (!columns.value.includes("No Status")) {
    columns.value.unshift("No Status");
  }

  issuesByColumn.value = {};
  columns.value.forEach(col => (issuesByColumn.value[col] = []));

  project.items.nodes.forEach(item => {
    const issue = item.content;
    if (issue) {
      issue.projectItemId = item.id;
      const statusNode = item.fieldValues.nodes.find(v => v.name && columns.value.includes(v.name));
      if (statusNode) {
        issuesByColumn.value[statusNode.name].push(issue);
      } else {
        issuesByColumn.value["No Status"].push(issue);
      }
    }
  });
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
