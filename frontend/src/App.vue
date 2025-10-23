
<template>
  <div class="app">
    <h1>GitHub Login Demo</h1>

    <button v-if="!user" @click="loginWithGithub">Login with GitHub</button>

    <div v-else>
      <h2>Hello, {{ user.login }}</h2>
      <img :src="user.avatar_url" width="80" />
      <button @click="loadRepos">Load My Repositories</button>

      <ul v-if="repos.length">
        <li v-for="repo in repos" :key="repo.id">
          <a :href="repo.html_url" target="_blank">{{ repo.name }}</a>
          <small>★ {{ repo.stargazers_count }}</small>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { ref, onMounted } from "vue";

const user = ref(null);
const repos = ref([]);

function loginWithGithub() {
  window.location.href = "http://localhost:3000/auth/github";
}

async function loadUser() {
  try {
    const res = await axios.get("http://localhost:3000/api/github/user", {
      withCredentials: true,
    });
    user.value = res.data;
  } catch {
    // not logged in yet
  }
}

async function loadRepos() {
  try {
    const res = await axios.get("http://localhost:3000/api/github/repos", {
      withCredentials: true,
    });
    repos.value = res.data;
  } catch (err) {
    console.error("Error loading repos:", err);
  }
}

onMounted(loadUser);
</script>
