# 💬 RealtimeChat — Multi-room WebSocket Chat app

A production-shaped, multi-room realtime chat application built on **Node.js + Express + Socket.IO**. Rooms, live presence, typing indicators, per-message timestamps, online user list, and rate-limited server-side — ready to deploy to Render/Railway/Hostinger in minutes.

![node](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![socket.io](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io)
![express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express)
![deploy](https://img.shields.io/badge/Deploy-Render/Railway-7fd68a?style=flat-square)

---

## ✨ Features

- 🛰️ **Real WebSockets** — true bidirectional messaging via Socket.IO
- 🚪 **Rooms** — anyone can join/create a room like `#marketing`, `#dev`
- 👥 **Live presence** — who's online in your room, updates in real time
- ⌨️ **Typing indicator** — animated "X is typing…" dots, throttled
- 💾 **Message history** — last 80 messages per room restored on join
- 🛡️ **Server-side safety** — rate limiting, length caps, and HTML-escaping on both ends
- 📱 **Responsive** — sidebar collapses to a mobile-friendly single column

## 🚀 Run locally

```bash
npm install
npm start          # → http://localhost:3000
```

Open two browser tabs, enter different names, and chat live.

## ☁️ Deploy (free)

### Render
1. Push this folder to a GitHub repo.
2. Render → **New Web Service** → pick the repo.
3. The free plan auto-detects `npm start`. No build command needed.
4. Done — your live URL is served over HTTPS with WebSockets enabled automatically.

### Railway / Hostinger
Same idea: add `npm start` as the start command and expose `$PORT`.

### Local only (optional)
Deploy the `public/` folder to Netlify — but note the server part must run somewhere (Socket.IO won't work without it).

## 🧠 Architecture

```
Browser (public/)                   Server (server.js)
┌──────────────────┐   Socket.IO    ┌──────────────────────┐
│ chat.js  ────────┼───────────────▶│ io.on('connection')  │
│ websocket events │ ◀──────────────│  join / msg / typing │
└──────────────────┘                │ rooms Map (history) │
                                    │ rate limiter (5/5s) │
                                    └──────────────────────┘
```

- Room state (names only + history) lives **in-memory** — perfect for demo scale.
- Swappable for Redis/Postgres for production persistence.

---
Built by [Kuruva Jayaram](https://github.com/Jayaram5685) · realtime done right.