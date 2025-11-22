<template>
  <div
    class="modal-backdrop"
    @mousedown.self="handleBackdropMouseDown"
    @mouseup.self="handleBackdropMouseUp"
  >
    <div class="modal-window">
      <div class="header-container">
        <div class="title">Create new issue</div>
        <i class="bi bi-x-lg close-btn" @click="close"></i>
      </div>

      <form @submit.prevent="submit">
        <div class="fields">
          <div class="form-group">
            <label>Add a title</label>
            <input
              v-model="data.title"
              type="text"
              class="form-control"
              placeholder="Title"
              required
            />
          </div>

          <div class="form-group description-group">
            <label>Add a description</label>
            <textarea
              v-model="data.description"
              class="form-control description-box"
              placeholder="Type your description here..."
              rows="6"
            ></textarea>
          </div>
        </div>

        <div class="buttons">
          <div class="variable-buttons">
            <UniversalDropdown
              :items="repoData.collaborators || []"
              label-key="login"
              search-key="login"
              id-key="id"
              :selected="data.assignee"
              placement="top"
              @select="(item) => updateField('assignee', item)"
            >
              <template #trigger>
                <div class="dropdown-trigger-btn" :class="{ 'has-value': data.assignee }">
                  <template v-if="data.assignee">
                    <img :src="data.assignee.avatar_url" class="avatar-small" />
                    <span class="truncate-text">{{ data.assignee.login }}</span>
                  </template>
                  <template v-else> Assignee </template>
                </div>
              </template>

              <template #item="{ item }">
                <div class="dropdown-row">
                  <img :src="item.avatar_url" class="avatar" />
                  <span>{{ item.login }}</span>
                </div>
              </template>
            </UniversalDropdown>

            <UniversalDropdown
              :items="repoData.labels || []"
              label-key="name"
              search-key="name"
              id-key="id"
              :multiple="true"
              :selected="data.labels"
              placement="top"
              @select="(item) => updateField('labels', item)"
            >
              <template #trigger>
                <div class="dropdown-trigger-btn" :class="{ 'has-value': data.labels.length > 0 }">
                  <template v-if="data.labels.length > 0">
                    <span
                      class="color-dot"
                      :style="{ backgroundColor: '#' + data.labels[0].color }"
                    ></span>
                    <span class="truncate-text">{{ data.labels[0].name }}</span>

                    <span v-if="data.labels.length > 1" class="more-counter">
                      +{{ data.labels.length - 1 }}
                    </span>
                  </template>
                  <template v-else> Labels </template>
                </div>
              </template>

              <template #item="{ item }">
                <div class="dropdown-row">
                  <span class="color-dot" :style="{ backgroundColor: '#' + item.color }"></span>
                  <span>{{ item.name }}</span>
                </div>
              </template>
            </UniversalDropdown>

            <UniversalDropdown
              :items="repoData.milestones || []"
              label-key="title"
              search-key="title"
              id-key="id"
              :selected="data.milestone"
              placement="top"
              @select="(item) => updateField('milestone', item)"
            >
              <template #trigger>
                <div class="dropdown-trigger-btn" :class="{ 'has-value': data.milestone }">
                  <i class="bi bi-signpost-split" v-if="data.milestone"></i>
                  <span class="truncate-text">
                    {{ data.milestone ? data.milestone.title : 'Milestone' }}
                  </span>
                </div>
              </template>
            </UniversalDropdown>
          </div>
          <div class="action-buttons">
            <button type="button" class="button cancel" @click="close">Cancel</button>
            <button type="submit" class="button create">Create</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, onBeforeUnmount } from 'vue'
import UniversalDropdown from '../UniversalDropdown.vue'

defineProps({ repoData: Object })

const emit = defineEmits(['close', 'submit'])

const data = reactive({
  title: '',
  description: '',
  assignee: null,
  labels: [],
  milestone: null,
})

let isMouseDownOnBackdrop = false

const handleBackdropMouseDown = () => {
  isMouseDownOnBackdrop = true
}

const handleBackdropMouseUp = () => {
  if (isMouseDownOnBackdrop) {
    close()
  }
  isMouseDownOnBackdrop = false
}

const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    close()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})

const updateField = (key, item) => {
  if (Array.isArray(data[key])) {
    const index = data[key].findIndex((i) => i.id === item.id)
    if (index > -1) {
      data[key].splice(index, 1)
    } else {
      data[key].push(item)
    }
    return
  }

  if (data[key] && data[key].id === item.id) {
    data[key] = null
  } else {
    data[key] = item
  }
}

const close = () => {
  emit('close')
}

const submit = () => {
  if (!data.title.trim()) {
    alert('Title is required!')
    return
  }

  const payload = {
    title: data.title,
    description: data.description,
    assignees: data.assignee ? [data.assignee.login] : [],
    labels: data.labels.map((l) => l.name),
    milestone: data.milestone ? data.milestone.number : null,
  }

  emit('submit', payload)

  data.title = ''
  data.description = ''
  data.assignee = null
  data.labels = []
  data.milestone = null

  close()
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.modal-window {
  width: clamp(360px, 90vw, 900px);
  height: clamp(500px, 90vh, 600px);
  background: #222;
  padding-top: 12px;
  padding-inline: 24px;
  border-radius: 12px;
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: #333 1px solid;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.title {
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  cursor: pointer;
  font-size: 18px;
  color: #aaa;
  transition: color 0.2s;
}
.close-btn:hover {
  color: #fff;
}

form {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.fields {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding-right: 5px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #ccc;
}

.form-control {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #151515 !important;
  color: white !important;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-control:focus {
  background-color: #151515 !important;
  color: white !important;
  border-color: #58a6ff;
  outline: none;
  box-shadow: none;
}

.description-group {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.description-box {
  flex: 1;
  resize: none;
  line-height: 1.5;
}

.buttons {
  width: 100%;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #333;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.variable-buttons {
  flex-grow: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.dropdown-trigger-btn {
  height: 32px;
  padding: 0 12px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #21262d;
  cursor: pointer;
  color: #c9d1d9;

  display: inline-flex;
  align-items: center;
  width: auto;
  max-width: 220px;

  gap: 8px;
  font-size: 13px;
  user-select: none;
  transition: all 0.2s;
}

.dropdown-trigger-btn:hover {
  background: #30363d;
  border-color: #8b949e;
}

.has-value {
  background: #252b33;
  color: #e6edf3;
  border-color: #444;
}

.truncate-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-counter {
  background: rgba(255, 255, 255, 0.15);
  padding: 1px 6px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
}

.avatar-small {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.dropdown-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.button {
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px solid rgba(240, 246, 252, 0.1);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: 0.2s;
}

.cancel {
  background: #21262d;
  color: #c9d1d9;
  border-color: rgba(240, 246, 252, 0.1);
}
.cancel:hover {
  background: #30363d;
  border-color: #8b949e;
}

.create {
  background: #238636;
  color: white;
  border-color: rgba(240, 246, 252, 0.1);
}
.create:hover {
  background: #2ea043;
}

.fields::-webkit-scrollbar {
  width: 8px;
}
.fields::-webkit-scrollbar-track {
  background: transparent;
}
.fields::-webkit-scrollbar-thumb {
  background-color: #444;
  border-radius: 4px;
}

input::placeholder,
textarea::placeholder {
  color: #666;
}
</style>
