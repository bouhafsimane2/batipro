import { useEffect, useState } from 'react';
import api, { isLoggedIn } from '../api/client';
import { getSocket } from '../api/socket';

// Nombre de messages non lus, mis à jour en temps réel
export default function useUnreadCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn()) return undefined;
    let cancelled = false;
    const refresh = () => api.get('/messages/unread-count')
      .then((res) => !cancelled && setCount(res.data.count))
      .catch(() => {});
    refresh();

    const socket = getSocket();
    socket?.on('message:new', refresh);
    socket?.on('conversation:read', refresh);
    return () => {
      cancelled = true;
      socket?.off('message:new', refresh);
      socket?.off('conversation:read', refresh);
    };
  }, []);

  return count;
}
