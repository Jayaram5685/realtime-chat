// RealtimeChat client
const socket = io();
const state = { name: 'Guest-' + Math.floor(1000 + Math.random() * 9000), room: 'general' };

const messagesEl = document.getElementById('messages');
const msgForm = document.getElementById('msgForm');
const msgInput = document.getElementById('msgInput');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const currentRoomEl = document.getElementById('currentRoom');
const userListEl = document.getElementById('userList');
const onlineEl = document.getElementById('online');
const typingEl = document.getElementById('typing');
const typingTextEl = document.getElementById('typingText');
const nameInput = document.getElementById('nameInput');

const timeFmt = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function addMsg({ user, text, ts }) {
  const own = user === state.name;
  const el = document.createElement('div');
  el.className = 'msg' + (own ? ' own' : '');
  el.innerHTML = `
    <span class="who">${escapeHtml(user)}${own ? ' · you' : ''}</span>
    <span class="bubble">${escapeHtml(text)}</span>
    <span class="time">${timeFmt(ts || Date.now())}</span>`;
  messagesEl.appendChild(el);
  autoscroll();
}

function addSystem(t) {
  const el = document.createElement('div');
  el.className = 'system';
  el.textContent = t;
  messagesEl.appendChild(el);
  autoscroll();
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function autoscroll() {
  const nearBottom = messagesEl.scrollHeight - messagesEl.scrollTop - messagesEl.clientHeight < 80;
  if (nearBottom) messagesEl.scrollTop = messagesEl.scrollHeight;
}

function join() {
  state.name = (nameInput.value.trim() || state.name).slice(0, 24);
  state.room = (roomInput.value.trim() || 'general').toLowerCase().replace(/\s+/g, '-').slice(0, 40);
  socket.emit('join', { room: state.room, name: state.name }, ({ ok, room, history }) => {
    if (!ok) return;
    state.room = room;
    currentRoomEl.textContent = room;
    messagesEl.innerHTML = '';
    for (const m of history) addMsg(m);
    addSystem(`Connected to #${room} as ${state.name}.`);
  });
}

joinBtn.addEventListener('click', join);
nameInput.addEventListener('change', () => { state.name = nameInput.value.trim() || state.name; });

// load room history on enter
socket.on('connect', join);

msgForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit('msg', text, ({ error } = {}) => {
    if (error) addSystem('⚠ ' + error);
  });
  msgInput.value = '';
  socket.emit('typing-stop');
});

// typing indicator (throttled)
let typingTimer = null;
msgInput.addEventListener('input', () => {
  if (msgInput.value && !typingTimer) socket.emit('typing');
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => { typingTimer = null; socket.emit('typing-stop'); }, 1200);
});

socket.on('msg', (m) => { typingEl.hidden = true; addMsg(m); });
socket.on('system', (t) => addSystem(t));
socket.on('presence', ({ users }) => {
  onlineEl.textContent = users.length;
  userListEl.innerHTML = users.map(u => `<li>${escapeHtml(u)}</li>`).join('');
});

// typing from others (debounced)
let typingHide = null;
socket.on('typing', ({ user }) => {
  if (user === state.name) return;
  typingEl.hidden = false;
  typingTextEl.textContent = `${user} is typing…`;
  clearTimeout(typingHide);
  typingHide = setTimeout(() => { typingEl.hidden = true; }, 1800);
});
socket.on('typing-stop', () => { typingEl.hidden = true; });

// prevent the server from over-writing the name input placeholder (cosmetic)
nameInput.placeholder = state.name;