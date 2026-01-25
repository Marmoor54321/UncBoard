// src/services/socket.js
import { io } from "socket.io-client";

const URL = "http://localhost:3000"; // np. http://localhost:3000

export const socket = io(URL, {
  autoConnect: false, // Połączymy się ręcznie dopiero gdy użytkownik się zaloguje
  withCredentials: true
});