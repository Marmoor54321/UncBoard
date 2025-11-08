// src/composables/useGithubBoard.js
import { ref, onMounted } from 'vue'
import axios from 'axios'

export function useGithubBoard() {
  const user = ref(null)
  const repos = ref([])
  const selectedRepo = ref(null)
  const scrollContainer = ref(null)
  const currentProjectId = ref(null)
  const fieldOptionsMap = ref({})
  const statusFieldId = ref(null)
  const columns = ref([])
  const issuesByColumn = ref({})

  const groups = { name: 'issues', pull: true, put: true }

  function loginWithGithub() {
    window.location.href = 'http://localhost:3000/auth/github'
  }

  async function loadUser() {
    try {
      const res = await axios.get('http://localhost:3000/api/github/user', { withCredentials: true, timeout: 5000 })
      user.value = res.data ?? null
      await loadRepos()
    } catch(e) {
      console.log('Not logged in',e)
    }
  }

  async function loadRepos() {
    try{
    const res = await axios.get('http://localhost:3000/api/github/repos', { withCredentials: true, timeout: 5000 })
    repos.value = res?.data ?? null
    }
    catch(e){
      console.error('Error loading repos:', e)
    }
  }

  async function selectRepo(repo) {
  try {
    selectedRepo.value = repo;

    const res = await axios.get(
      `http://localhost:3000/api/github/project-items/${repo.owner.login}/${repo.name}`,
      { withCredentials: true, timeout: 5000 }
    );

    if (!res?.data?.data?.repository?.projectsV2?.nodes?.length) {
      throw new Error("Brak danych projektu w odpowiedzi API");
    }

    const project = res.data.data.repository.projectsV2.nodes[0];
    if (!project?.id) {
      throw new Error("Nie udało się pobrać ID projektu");
    }

    currentProjectId.value = project.id;

    const fields = project?.fields?.nodes || [];
    const statusField = fields.find(f => f.options && f.options.length);
    statusFieldId.value = statusField?.id || null;

    fieldOptionsMap.value = {};
    columns.value = [];

    if (statusField?.options) {
      statusField.options.forEach(o => {
        const normalized = o.name?.toLowerCase().trim().replaceAll('_', ' ') || '';
        fieldOptionsMap.value[normalized] = o.id;
        columns.value.push(o.name);
      });
    }

    if (!columns.value.includes("No Status")) {
      columns.value.unshift("No Status");
    }

    issuesByColumn.value = {};
    columns.value.forEach(col => (issuesByColumn.value[col] = []));

    const items = project?.items?.nodes || [];
    items.forEach(item => {
      if (!item?.content) return;

      const issue = item.content;
      issue.projectItemId = item.id;

      const statusNode = item.fieldValues?.nodes?.find(
        v => v.name && columns.value.includes(v.name)
      );

      if (statusNode) {
        issuesByColumn.value[statusNode.name].push(issue);
      } else {
        issuesByColumn.value["No Status"].push(issue);
      }
    });

  } catch (e) {
    console.error("Błąd podczas ładowania projektu:", e?.message || e);
  }
}

  async function onDragEnd(event) {
    const domItem = event.item
    const itemId = domItem?.dataset?.itemId
    const newColumnHeader = event.to?.closest('.card')?.querySelector('.card-header')?.innerText?.trim()

    if (!itemId || !newColumnHeader) return

    const normalizedColumn = newColumnHeader.toLowerCase().trim().replaceAll('_', ' ')
    const optionId = fieldOptionsMap.value[normalizedColumn]

    try {
      if (normalizedColumn === 'no status') {
        await axios.post(
          'http://localhost:3000/api/github/clear-item-field',
          { projectId: currentProjectId.value, itemId, fieldId: statusFieldId.value },
          { withCredentials: true, timeout: 5000 }
        )
      } else {
        if (!optionId) return
        await axios.post(
          'http://localhost:3000/api/github/update-item',
          { projectId: currentProjectId.value, itemId, fieldId: statusFieldId.value, optionId },
          { withCredentials: true, timeout: 5000 }
        )
      }
    } catch (err) {
      console.error('GitHub update/clear failed:', err.response?.data || err.message)
    }
  }

  onMounted(loadUser)

  return {
    user,
    repos,
    selectedRepo,
    scrollContainer,
    columns,
    issuesByColumn,
    loginWithGithub,
    selectRepo,
    onDragEnd,
    groups
  }
}
