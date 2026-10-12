import { io } from 'socket.io-client';
import { API_URL } from './client';

// Connexion Socket.IO unique, partagée par la messagerie et le badge de la navbar
let socket = null;
let socketToken = null;

export function getSocket() {
  const token = localStorage.getItem('authToken');
  if (!token) return null;
  if (socket && socketToken === token) return socket;
  if (socket) socket.disconnect();
  socketToken = token;
  socket = io(API_URL, { auth: { token }, transports: ['websocket', 'polling'] });
  return socket;
}

export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
  socketToken = null;
}

// Émet un événement et renvoie une promesse résolue avec l'accusé de réception du serveur
export function emitWithAck(event, payload) {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    if (!s) return reject(new Error('Non connecté'));
    s.timeout(8000).emit(event, payload, (err, res) => {
      if (err) return reject(new Error('Le serveur ne répond pas'));
      if (!res?.ok) return reject(new Error(res?.error || 'Erreur'));
      resolve(res.data);
    });
  });
}
