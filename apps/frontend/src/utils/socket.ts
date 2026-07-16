import { io } from 'socket.io-client';

export const socket = io({
  autoConnect: false, // Hanya koneksi saat Admin login (di AdminLayout)
});
