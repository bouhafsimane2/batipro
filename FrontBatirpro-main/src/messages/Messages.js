import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { apiError, currentUserId, isLoggedIn } from '../api/client';
import { getSocket, emitWithAck } from '../api/socket';
import { Navbar } from '../components/navbar/navbar';
import AdminLayout from '../admin/components/AdminLayout';
import './messages.css';

const PAGE_SIZE = 30;

const fullName = (u) => [u?.first_name, u?.last_name].filter(Boolean).join(' ') || u?.username || 'Utilisateur';
const initials = (u) => fullName(u).split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function Avatar({ user, online }) {
  return (
    <div className="msg-avatar">
      {user?.image_url ? <img src={user.image_url} alt="" /> : <span>{initials(user)}</span>}
      {online && <i className="msg-online-dot" title="En ligne" />}
    </div>
  );
}

export default function Messages() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = Number(searchParams.get('c')) || null;
  const me = currentUserId();
  const isAdmin = localStorage.getItem('user_type') === 'admin';

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [typingFrom, setTypingFrom] = useState(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const listEndRef = useRef(null);
  const activeIdRef = useRef(activeId);
  const typingTimeout = useRef(null);
  const lastTypingSent = useRef(0);
  activeIdRef.current = activeId;

  const active = conversations.find((c) => c.id === activeId) || null;

  const scrollToBottom = () => requestAnimationFrame(() => listEndRef.current?.scrollIntoView({ block: 'end' }));

  // Insère ou met à jour une conversation et la remonte en tête de liste
  const upsertConversation = useCallback((conv) => {
    setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
  }, []);

  const markRead = useCallback((conversationId) => {
    emitWithAck('conversation:read', { conversation_id: conversationId }).catch(() => {});
    setConversations((prev) => prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c)));
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) navigate('/login');
  }, [navigate]);

  // Liste des conversations
  useEffect(() => {
    if (!isLoggedIn()) return;
    api.get('/conversations')
      .then((res) => setConversations(res.data))
      .catch((err) => setError(apiError(err, 'Impossible de charger les conversations')))
      .finally(() => setLoadingList(false));
  }, []);

  // Messages de la conversation ouverte
  useEffect(() => {
    setMessages([]);
    setTypingFrom(null);
    setError('');
    if (!activeId) return;
    let cancelled = false;
    api.get(`/conversations/${activeId}/messages`, { params: { limit: PAGE_SIZE } })
      .then((res) => {
        if (cancelled) return;
        setMessages(res.data);
        setHasMore(res.data.length === PAGE_SIZE);
        scrollToBottom();
        markRead(activeId);
      })
      .catch((err) => !cancelled && setError(apiError(err, 'Conversation introuvable')));
    // Si la conversation n'est pas encore dans la liste (ouverte depuis un profil), on la récupère
    api.get(`/conversations/${activeId}`).then((res) => {
      if (!cancelled) setConversations((prev) => (prev.some((c) => c.id === res.data.id) ? prev : [res.data, ...prev]));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [activeId, markRead]);

  // Événements temps réel
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return undefined;

    const onMessage = ({ message, conversation }) => {
      const isActive = message.conversation_id === activeIdRef.current;
      upsertConversation(isActive ? { ...conversation, unread_count: 0 } : conversation);
      if (isActive) {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
        setTypingFrom(null);
        scrollToBottom();
        if (message.sender_id !== me) markRead(message.conversation_id);
      }
    };
    const onRead = ({ conversation_id, reader_id, read_at }) => {
      if (conversation_id !== activeIdRef.current || reader_id === me) return;
      setMessages((prev) => prev.map((m) => (m.sender_id === me && !m.read_at ? { ...m, read_at } : m)));
    };
    const onTyping = ({ conversation_id, user_id, typing }) => {
      if (conversation_id !== activeIdRef.current) return;
      setTypingFrom(typing ? user_id : null);
      clearTimeout(typingTimeout.current);
      if (typing) typingTimeout.current = setTimeout(() => setTypingFrom(null), 4000);
    };
    const onPresence = ({ user_id, online }) => {
      setConversations((prev) => prev.map((c) => (c.other_user.id === user_id
        ? { ...c, other_user: { ...c.other_user, online } } : c)));
    };

    socket.on('message:new', onMessage);
    socket.on('conversation:read', onRead);
    socket.on('typing', onTyping);
    socket.on('presence', onPresence);
    return () => {
      socket.off('message:new', onMessage);
      socket.off('conversation:read', onRead);
      socket.off('typing', onTyping);
      socket.off('presence', onPresence);
      clearTimeout(typingTimeout.current);
    };
  }, [me, markRead, upsertConversation]);

  // Recherche d'utilisateurs pour démarrer une conversation
  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) { setSearchResults([]); return undefined; }
    const t = setTimeout(() => {
      api.get('/users/search', { params: { q } }).then((res) => setSearchResults(res.data)).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const openConversation = (id) => setSearchParams({ c: String(id) });

  const startConversation = async (userId) => {
    try {
      const res = await api.post('/conversations', { user_id: userId });
      upsertConversation(res.data);
      setSearch('');
      openConversation(res.data.id);
    } catch (err) {
      setError(apiError(err));
    }
  };

  const loadOlder = async () => {
    if (!messages.length) return;
    const res = await api.get(`/conversations/${activeId}/messages`, { params: { before: messages[0].id, limit: PAGE_SIZE } });
    setMessages((prev) => [...res.data, ...prev]);
    setHasMore(res.data.length === PAGE_SIZE);
  };

  const send = async (e) => {
    e?.preventDefault();
    const content = draft.trim();
    if (!content || !activeId || sending) return;
    setSending(true);
    setError('');
    try {
      const message = await emitWithAck('message:send', { conversation_id: activeId, content });
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      setDraft('');
      scrollToBottom();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const onDraftChange = (e) => {
    setDraft(e.target.value);
    const now = Date.now();
    if (activeId && now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      getSocket()?.emit('typing', { conversation_id: activeId, typing: true });
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) send(e);
  };

  const lastMine = [...messages].reverse().find((m) => m.sender_id === me);

  const layout = (
      <div className={`msg-layout ${activeId ? 'has-active' : ''}`}>
        <aside className="msg-sidebar">
          <div className="msg-sidebar-head">
            <h2>Messages</h2>
            <input
              type="search"
              placeholder="Rechercher une personne…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {search.trim().length >= 2 ? (
            <ul className="msg-conv-list">
              {searchResults.length === 0 && <li className="msg-empty">Aucun résultat</li>}
              {searchResults.map((u) => (
                <li key={u.id}>
                  <button type="button" className="msg-conv" onClick={() => startConversation(u.id)}>
                    <Avatar user={u} online={u.online} />
                    <div className="msg-conv-body">
                      <div className="msg-conv-top"><strong>{fullName(u)}</strong></div>
                      <div className="msg-conv-preview">@{u.username}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="msg-conv-list">
              {loadingList && <li className="msg-empty">Chargement…</li>}
              {!loadingList && conversations.length === 0 && (
                <li className="msg-empty">
                  Aucune conversation. Recherchez une personne ou contactez un professionnel depuis son profil.
                </li>
              )}
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`msg-conv ${c.id === activeId ? 'active' : ''}`}
                    onClick={() => openConversation(c.id)}
                  >
                    <Avatar user={c.other_user} online={c.other_user.online} />
                    <div className="msg-conv-body">
                      <div className="msg-conv-top">
                        <strong>{fullName(c.other_user)}</strong>
                        <time>{formatTime(c.last_message?.created_at || c.updated_at)}</time>
                      </div>
                      <div className="msg-conv-preview">
                        <span>
                          {c.last_message
                            ? `${c.last_message.sender_id === me ? 'Vous : ' : ''}${c.last_message.content}`
                            : 'Nouvelle conversation'}
                        </span>
                        {c.unread_count > 0 && <b className="msg-badge">{c.unread_count}</b>}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="msg-thread">
          {!activeId ? (
            <div className="msg-placeholder">
              <p>Sélectionnez une conversation pour commencer à discuter.</p>
            </div>
          ) : (
            <>
              <header className="msg-thread-head">
                <button type="button" className="msg-back" onClick={() => setSearchParams({})} aria-label="Retour">←</button>
                {active && <Avatar user={active.other_user} online={active.other_user.online} />}
                <div>
                  <strong>{active ? fullName(active.other_user) : '…'}</strong>
                  <small>
                    {typingFrom ? 'écrit…' : active?.other_user.online ? 'En ligne' : 'Hors ligne'}
                  </small>
                </div>
                {active?.other_user.professional_id && (
                  <button
                    type="button"
                    className="msg-profile-link"
                    onClick={() => navigate(`/my_profils?id=${active.other_user.professional_id}`)}
                  >
                    Voir le profil
                  </button>
                )}
              </header>

              <div className="msg-list">
                {hasMore && (
                  <button type="button" className="msg-older" onClick={loadOlder}>Messages précédents</button>
                )}
                {messages.length === 0 && !error && <p className="msg-empty">Envoyez le premier message 👋</p>}
                {messages.map((m) => {
                  const mine = m.sender_id === me;
                  return (
                    <div key={m.id} className={`msg-bubble-row ${mine ? 'mine' : 'theirs'}`}>
                      <div className="msg-bubble">
                        <p>{m.content}</p>
                        <time>
                          {formatTime(m.created_at)}
                          {mine && m.id === lastMine?.id && (m.read_at ? ' · Vu' : ' · Envoyé')}
                        </time>
                      </div>
                    </div>
                  );
                })}
                <div ref={listEndRef} />
              </div>

              {error && <div className="msg-error">{error}</div>}

              <form className="msg-composer" onSubmit={send}>
                <textarea
                  rows={1}
                  placeholder="Écrire un message…"
                  value={draft}
                  onChange={onDraftChange}
                  onKeyDown={onKeyDown}
                  maxLength={2000}
                />
                <button type="submit" disabled={!draft.trim() || sending}>Envoyer</button>
              </form>
            </>
          )}
        </section>
      </div>
  );

  // Les admins gardent leur barre latérale ; les autres utilisateurs ont la navbar du site
  if (isAdmin) return <AdminLayout>{layout}</AdminLayout>;
  return (
    <div className="messagesPage">
      <Navbar />
      {layout}
    </div>
  );
}
