<template>
  <div class="chat-details text-white p-4" style="background-color: #232427; height: 100vh; display: flex; flex-direction: column;">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex align-items-center gap-3">
        <img :src="org.avatar_url" width="40" height="40" class="rounded-circle" />
        <h4 class="m-0">{{ org.login }} Team Chat</h4>
      </div>
      <button class="btn btn-link text-secondary p-0" @click="$emit('close')">
        <i class="bi bi-x-lg fs-4"></i>
      </button>
    </div>

    <hr class="border-secondary" />

    <div class="messages-container flex-grow-1 overflow-y-auto mb-3 pr-2" ref="scrollBox">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-purple" role="status"></div>
      </div>

      <div v-else class="d-flex flex-column gap-3">
        <div v-for="msg in messages" :key="msg._id" class="message-wrapper">
          <div class="comment-box border border-secondary rounded">
            <div class="comment-header d-flex align-items-center p-2 border-bottom border-secondary bg-dark-soft">
              <img :src="msg.sender.avatar_url" width="24" height="24" class="rounded-circle me-2" />
              <span class="fw-bold me-2" style="font-size: 0.9rem">{{ msg.sender.login }}</span>
              <span class="text-secondary ms-auto" style="font-size: 0.8rem">
                {{ formatDate(msg.timestamp) }}
              </span>
            </div>
            <div class="comment-body p-3 bg-dark-custom">
              {{ msg.text }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="message-input-area mt-auto">
      <div class="input-group">
        <textarea 
          v-model="newMessage" 
          @keyup.enter.exact.prevent="sendMessage"
          class="form-control bg-dark text-white border-secondary" 
          placeholder="Write a message..."
          rows="2"
        ></textarea>
        <button class="btn btn-purple" @click="sendMessage">
          <i class="bi bi-send"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import axios from 'axios'
import { io } from 'socket.io-client'

const props = defineProps({
  org: Object, // Obiekt organizacji z GitHub API
  currentUser: Object // Twój zalogowany użytkownik (login, avatar_url, github_id)
})

const messages = ref([])
const newMessage = ref('')
const loading = ref(true)
const scrollBox = ref(null)
let socket = null

const scrollToBottom = async () => {
  await nextTick()
  if (scrollBox.value) {
    scrollBox.value.scrollTop = scrollBox.value.scrollHeight
  }
}

const fetchHistory = async () => {
  loading.value = true
  try {
    const res = await axios.get(`http://localhost:3000/api/chat/${props.org.id}`, { withCredentials: true })
    messages.value = res.data
    scrollToBottom()
  } catch (err) {
    console.error("Failed to load history", err)
  } finally {
    loading.value = false
  }
}

const sendMessage = () => {
  if (!newMessage.value.trim()) return

  if (!props.currentUser) {
    console.error("Błąd: Nie przekazano currentUser do komponentu OrgChat!");
    return;
  }
  const messageData = {

    org_id: String(props.org.id),
    sender: {
      github_id: String(props.currentUser.id),
      login: props.currentUser.login,
      avatar_url: props.currentUser.avatar_url
    },
    text: newMessage.value
  }

  socket.emit('send_message', messageData)
  newMessage.value = ''
}

onMounted(() => {
  fetchHistory()

  socket = io('http://localhost:3000')
  
  socket.on('connect', () => {
    socket.emit('join_room', String(props.org.id))
  })

  socket.on('receive_message', (msg) => {
    messages.value.push(msg)
    scrollToBottom()
  })
})

onUnmounted(() => {
  if (socket) socket.disconnect()
})

const formatDate = (date) => new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
</script>

<style scoped>
.bg-dark-soft { background-color: #3a3b40; }
.bg-dark-custom { background-color: #303236; }
.btn-purple { background-color: #aa50e7; color: white; border: none; }
.btn-purple:hover { background-color: #923cc9; }
.text-purple { color: #aa50e7; }
/* Ukrywanie scrollbara dla estetyki */
.messages-container::-webkit-scrollbar { width: 6px; }
.messages-container::-webkit-scrollbar-thumb { background: #444; border-radius: 10px; }
</style>