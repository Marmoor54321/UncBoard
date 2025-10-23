<!--<script setup lang="ts"></script>--> 

<template>
  <div class="app">
    <h1>GitHub Issues Demo</h1>

    <button v-if="!user" @click="loginWithGithub">Login with GitHub</button>

    <div v-else>
      <h2>Hello, {{ user.login }}</h2>
      <img :src="user.avatar_url" width="80" />

      <h3>Your Repositories</h3>
      <ul v-if="repos.length">
        <li
          v-for="repo in repos"
          :key="repo.id"
          @click="selectRepo(repo)"
          style="cursor:pointer"
        >
          {{ repo.name }}
        </li>
      </ul>

      <div v-if="selectedRepo">
        <h3>Issues for {{ selectedRepo.name }}</h3>
        <ul>
          <li v-for="issue in issues" :key="issue.id">
            <a :href="issue.html_url" target="_blank">{{ issue.title }}</a>
            <small> — #{{ issue.number }} ({{ issue.state }})</small>
          </li>
        </ul>
        <p v-if="!issues.length">No issues found.</p>
      </div>
    </div>
  </div>
</template>

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
  issues.value = []; // clear previous

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

onMounted(loadUser);
</script>

