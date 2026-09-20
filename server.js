// RealtimeChat — multi-room WebSocket chat
// Node.js + Express + Socket.IO. Deploy: Render/Railway (PORT required), or bare `npm start`.
const http = require('http');
const path = require('path');
const express = require('express');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const HISTORY = 80;         // messages kept per room
const MAX_LEN = 800;        // max chars per message
const RATE = 5;             // max msgs in window
const RATE_WINDOW = 5000;   // ms

const app = express();
const server = http.createServer(app);
const io = new Server(server, { serveClient: true });

app.use(express.static(path.join(__dirname, 'public')));

// roomId -> { messages: [{user,text,ts}] , history: Array<{id,user,text,ts}> }
const rooms = new Map();

function roomLog(room) {
  if (!rooms.has(room)) rooms.set(room, { messages: [] });
  return rooms.get(room).messages;
}

function sanitize(s, max = MAX_LEN) {
  return String(s || '').replace(/[<>]/g, '').slice(0, max).trim();
}

function pushLog(room, entry) {
  const log = roomLog(room);
  log.push(entry);
  if (log.length > HISTORY) log.shift();
}

function roomUsers(room) {
  const sids = new Map();
  io.in(room).fetchSockets().then(socks => {
    for (const s of socks) sids.set(s.data.name, true);
    io.to(room).emit('presence', { users: [...sids.keys()].sort() });
  });
}

io.on('connection', (socket) => {
  socket.data = { name: 'Guest-' + Math.floor(1000 + Math.random() * 9000), room: null, rate: [] };

  socket.on('join', ({ room, name }, ack = () => {}) => {
    const cleanName = sanitize(name, 24) || socket.data.name;
    const cleanRoom = sanitize(room, 40).toLowerCase().replace(/\s+/g, '-') || 'general';

    socket.data.name = cleanName;
    socket.data.room = cleanRoom;
    socket.data.rate = [];

    socket.join(cleanRoom);
    const history = roomLog(cleanRoom);
    ack({ ok: true, room: cleanRoom, history });

    io.to(cleanRoom).emit('system', `${cleanName} joined.`);
    roomUsers(cleanRoom);
  });

  socket.on('msg', (text, ack = () => {}) => {
    const room = socket.data.room;
    if (!room) return ack({ error: 'Join a room first.' });

    const now = Date.now();
    socket.data.rate = socket.data.rate.filter(t => now - t < RATE_WINDOW);
    if (socket.data.rate.length >= RATE) return ack({ error: 'Slow down a little.' });

    const body = sanitize(text);
    if (!body) return ack({ error: 'Empty message.' });

    socket.data.rate.push(now);
    const msg = { id: socket.id + '-' + now, user: socket.data.name, text: body, ts: now };
    pushLog(room, msg);
    io.to(room).emit('msg', msg);
    ack({ ok: true });
  });

  socket.on('typing', () => {
    if (socket.data.room) {
      socket.to(socket.data.room).emit('typing', { user: socket.data.name });
    }
  });

  socket.on('disconnect', () => {
    const room = socket.data.room;
    if (room) {
      io.to(room).emit('system', `${socket.data.name} left.`);
      roomUsers(room);
    }
  });
});

server.listen(PORT, () => console.log(`RealtimeChat running → http://localhost:${PORT}`));