<!--<script setup lang="ts"></script>--> 

<template>
  <div class="container-fluid vh-100 d-flex flex-column p-0" style="background-color: #1d1e20;">
    <header class="text-white p-3" style="background-color: #303236;">
      <h1 class="m-0 fs-3">uncBoard</h1>
    </header>

    <div class="flex-grow-1 d-flex overflow-hidden">
      <!-- LEWY PANEL -->
      <aside class="border-end p-3" style="background-color: #1d1e20; width: 20%; min-width: 250px; overflow-y: auto;">
        <div v-if="!user" class="text-center mt-4 text-white">
          <button class="btn btn-dark" @click="loginWithGithub">
            <i class="bi bi-github me-2"></i> Login with GitHub
          </button>
        </div>

        <div v-else >
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
      <main class="flex-grow-1 p-4 overflow-auto">
        <div v-if="!selectedRepo" class="text-center text-white mt-5">
          <h4>Select a repository to view its issues</h4>
        </div>

        <div v-else>
          <h3 class="mb-4 text-white">
            Issues for <span class="text-primary">{{ selectedRepo.name }}</span>
          </h3>

          <!-- KANBAN BOARD -->
          <div class="row row-cols-1 row-cols-md-4 g-3">
            <div v-for="status in ['todo', 'in progress', 'in review', 'done']" :key="status" class="col">
              <div class="card h-100" style="border: 1px solid #aa50e7;">
                <div class="card-header bg-dark text-white text-uppercase small" >
                  {{ status }}
                </div>
                <div class="card-body rounded-bottom-1" style="background-color: #303236;">
                  <div
                    v-for="issue in issuesByStatus(status)"
                    :key="issue.id"
                    class="p-2 mb-2 border rounded"
                  >
                    <strong>#{{ issue.number }}</strong> {{ issue.title }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>


<style scoped>
.custom-list .list-group-item {
  background-color: #303236;
  color: white;
  border: none !important;
  
}

.custom-list .list-group-item:hover {
  border: 1px solid #aa50e7 !important; /* obwódka po najechaniu */
  background-color: #3b3e42 !important;
  color: white;
}

.custom-list .list-group-item.active {
  border: 2px solid #aa50e7 !important; 
  background-color: #3b3e42 !important;
}
</style>







<script setup>
import axios from "axios";
import { ref, onMounted } from "vue";

const user = ref(null);
const repos = ref([]);
const issues = ref([]);
const selectedRepo = ref(null);

function loginWithGithub() {
  window.location.href = "http://localhost:3000/auth/github";
}

async function loadUser() {
  try {
    const res = await axios.get("http://localhost:3000/api/github/user", {
      withCredentials: true,
    });
    user.value = res.data;
    await loadRepos();
  } catch {
    // not logged in
  }
}

async function loadRepos() {
  const res = await axios.get("http://localhost:3000/api/github/repos", {
    withCredentials: true,
  });
  repos.value = res.data;
}

async function selectRepo(repo) {
  selectedRepo.value = repo;
  issues.value = [];
  try {
    const res = await axios.get(
      `http://localhost:3000/api/github/issues/${repo.owner.login}/${repo.name}`,
      { withCredentials: true }
    );
    issues.value = res.data;
  } catch (err) {
    console.error("Error loading issues:", err);
  }
}

// przykładowa funkcja do filtrowania po statusie
function issuesByStatus(status) {
  return issues.value.filter((i) =>
    i.labels.some((l) => l.name.toLowerCase() === status)
  );
}

onMounted(loadUser);
</script>