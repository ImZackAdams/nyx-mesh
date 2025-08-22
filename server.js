// Tiny WebSocket signaling relay: rooms + broadcast (+ join notify, limits, heartbeat)
// Usage: node server.js  (PORT=8080 by default)
import http from "http";
import { WebSocketServer } from "ws";

const MAX_MSG_BYTES = 64 * 1024;       // 64KB hard cap per message
const MAX_MSGS_PER_5S = 200;           // simple per-socket rate limit
const PING_INTERVAL_MS = 30000;        // send ping every 30s to detect dead sockets

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("nyxmesh-signal up\n");
});

const wss = new WebSocketServer({ server });
const rooms = new Map(); // roomId -> Set<WebSocket>

function joinRoom(ws, roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId).add(ws);
  ws.roomId = roomId;

  // Acknowledge to the joiner
  safeSend(ws, { type: "JOINED", room: roomId });

  // Notify existing peers so the coordinator can resend an OFFER
  for (const peer of rooms.get(roomId)) {
    if (peer !== ws && peer.readyState === peer.OPEN) {
      safeSend(peer, { type: "PEER_JOINED", room: roomId });
    }
  }
}

function leaveRoom(ws) {
  const r = ws.roomId;
  if (!r) return;
  const set = rooms.get(r);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) rooms.delete(r);
  ws.roomId = null;
}

function fanout(ws, msgObj) {
  const r = ws.roomId;
  if (!r) return;
  const set = rooms.get(r);
  if (!set) return;
  const str = JSON.stringify(msgObj);
  for (const peer of set) {
    if (peer !== ws && peer.readyState === peer.OPEN) {
      try { peer.send(str); } catch {}
    }
  }
}

function safeSend(ws, obj) {
  try {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
  } catch {}
}

wss.on("connection", (ws) => {
  ws.roomId = null;

  // --- heartbeat fields ---
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });

  // --- naive per-socket rate limiting ---
  ws._count = 0;
  let resetTimer = setInterval(() => { ws._count = 0; }, 5000);

  ws.on("message", (buf) => {
    // Size guard
    if (buf.length > MAX_MSG_BYTES) return;

    // Rate limit
    ws._count++;
    if (ws._count > MAX_MSGS_PER_5S) return;

    let msg;
    try {
      // Accept either text or Buffer
      const raw = Buffer.isBuffer(buf) ? buf.toString("utf8") : String(buf);
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    // JOIN: must include a string room id
    if (msg.type === "JOIN" && typeof msg.room === "string" && msg.room) {
      joinRoom(ws, msg.room);
      return;
    }

    // Anything else must be inside a room
    if (!ws.roomId) return;

    // Fan-out: OFFER / ANSWER / ICE / custom app events
    fanout(ws, msg);
  });

  ws.on("close", () => {
    leaveRoom(ws);
    clearInterval(resetTimer);
  });

  ws.on("error", () => {
    try { ws.close(); } catch {}
    clearInterval(resetTimer);
  });
});

// Heartbeat to clean up dead sockets
const pingTimer = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) {
      try { ws.terminate(); } catch {}
      continue;
    }
    ws.isAlive = false;
    try { ws.ping(); } catch {}
  }
}, PING_INTERVAL_MS);

wss.on("close", () => clearInterval(pingTimer));

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log("signal listening on", PORT);
});
