<template>
  <div class="chat-window card text-white bg-dark"style="border-color: #aa50e7;">
    <div class="card-header d-flex justify-content-between align-items-center py-2"style="border-color: #aa50e7;">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-chat-dots-fill " style="color: #aa50e7;"></i>
        <h6 class="m-0 text-truncate" style="max-width: 200px;">{{ orgName }}</h6>
      </div>
      <button class="btn btn-sm btn-link text-white p-0" @click="$emit('close')">
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <div class="card-body p-2 chat-body scrollable-list-container" ref="messagesContainer">
      <div v-if="loading" class="text-center text-muted mt-4">
        <span class="spinner-border spinner-border-sm"></span> Loading history...
      </div>
      
      <div v-else-if="messages.length === 0" class="text-center text-white mt-4 small">
        No messages yet. Say hello! 👋
      </div>

      <ul v-else class="list-unstyled mb-0 d-flex flex-column gap-2">
        <li 
          v-for="msg in messages" 
          :key="msg._id" 
          class="d-flex w-100"
          :class="isMyMessage(msg) ? 'justify-content-end' : 'justify-content-start'"
        >
          <div 
            class="message-bubble p-2 rounded"
            :class="isMyMessage(msg) ? 'text-white my-msg' : 'bg-secondary text-light other-msg'"
          >
            <div v-if="!isMyMessage(msg)" class="d-flex align-items-center gap-1 mb-1 sender-info">
              <img 
                :src="msg.sender?.avatar_url || 'https://github.com/identicons/jasonlong.png'" 
                class="rounded-circle" 
                width="16" 
                height="16"
              >
              <span class="fw-bold small">{{ msg.sender?.login || 'Unknown' }}</span>
            </div>
            
            <div class="message-text">{{ msg.text }}</div>
            <div class="text-end mt-1">
                <small class="opacity-75" style="font-size: 0.65rem;">{{ formatTime(msg.createdAt) }}</small>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div class="card-footer p-2" style="border-color: #aa50e7;">
      <form @submit.prevent="sendMessage" class="d-flex gap-2">
        <input 
          v-model="newMessage" 
          type="text" 
          class="form-control form-control-sm bg-dark text-white " style="border-color: #aa50e7;"
          placeholder="Type a message..."
          :disabled="!connected"
        >
        <button type="submit" class="btn btn-sm" style="background-color: #aa50e7;">
          <i class="bi bi-send-fill"></i>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { socket } from '../services/socket'; 
import axios from 'axios';
import { getApiBaseUrl } from '../api/getApiBaseUrl';

const props = defineProps({
  orgId: { type: String, required: true },
  orgName: { type: String, default: 'Chat' },
  user: { type: Object, required: true }
});

const emit = defineEmits(['close']);

const messages = ref([]);
const newMessage = ref('');
const loading = ref(true);
const connected = ref(false);
const messagesContainer = ref(null);

// --- API & Socket Logic ---

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const fetchHistory = async () => {
  try {
    loading.value = true;
    const res = await axios.get(`${getApiBaseUrl()}/api/orgs/${props.orgId}/messages`, { withCredentials: true });
    messages.value = res.data;
    scrollToBottom();
  } catch (err) {
    console.error("Failed to load chat history", err);
  } finally {
    loading.value = false;
  }
};

const sendMessage = () => {
  if (!newMessage.value.trim()) return;

  const payload = {
    orgId: props.orgId,
    senderId: props.user._id,
    text: newMessage.value
  };

  socket.emit('send_message', payload);
  newMessage.value = '';
};

const isMyMessage = (msg) => {
  // Porównujemy ID (obsługa string vs ObjectId)
  const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
  return senderId === props.user._id;
};

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- Lifecycle ---

onMounted(() => {
  // 1. Podłącz socket (jeśli nie jest)
  if (!socket.connected) socket.connect();
  connected.value = true;

  // 2. Dołącz do pokoju organizacji
  socket.emit('join_organization', props.orgId);

  // 3. Pobierz historię
  fetchHistory();

  // 4. Nasłuchuj wiadomości
  socket.on('receive_message', (msg) => {
    // Upewnij się, że wiadomość jest dla tej organizacji (zabezpieczenie frontendowe)
    if (msg.organization === props.orgId) {
      messages.value.push(msg);
      scrollToBottom();
    }
  });
});

onBeforeUnmount(() => {
  socket.off('receive_message');
  // Opcjonalnie: opuść pokój, ale socket.io robi to automatycznie przy disconnect
});

// Jeśli orgId się zmieni (np. użytkownik kliknie inną organizację bez zamykania okna)
watch(() => props.orgId, (newId, oldId) => {
    if (newId !== oldId) {
        socket.emit('join_organization', newId);
        fetchHistory();
    }
});
</script>

<style scoped>
.chat-window {
  position: fixed;
  bottom: 20px;
  right: 360px; /* Obok Sidebara */
  width: 320px;
  height: 450px;
  z-index: 1050;
  box-shadow: 0 4px 15px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
}

.chat-body {
  overflow-y: auto;
  flex: 1;
  background-color: #25272b;
  scrollbar-width: thin;
}

.chat-body::-webkit-scrollbar {
    width: 6px;
}
.chat-body::-webkit-scrollbar-thumb {
    background-color: #444; 
    border-radius: 4px;
}

.message-bubble {
  max-width: 85%;
  word-wrap: break-word;
}
.my-msg {
    border-bottom-right-radius: 0 !important;
    background-color: #aa50e7; 
    color: white;
}
.other-msg {
    border-bottom-left-radius: 0 !important;
    background-color: #3b3e42 !important;
}
.sender-info {
    font-size: 0.75rem;
    color: #aaa;
}

.form-control:focus {
    box-shadow: none;
}

.scrollable-list-container {
  overflow-y: auto;
  flex-grow: 1;
  min-height: 0;
  padding-bottom: 20px;
  padding-right: 5px;
  scrollbar-width: thin;
  scrollbar-color: #444 #25272b;
}
</style>