// worker.js — Tiny WebSocket rendezvous (rooms + fanout)
// Deploy: wrangler publish
const rooms = new Map(); // roomId -> Set<WebSocket>

function joinRoom(ws, roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId).add(ws);
  ws.roomId = roomId;
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

function fanout(ws, data) {
  const r = ws.roomId;
  if (!r) return;
  const set = rooms.get(r);
  if (!set) return;
  for (const peer of set) {
    if (peer !== ws) {
      try { peer.send(data); } catch {}
    }
  }
}

export default {
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname !== "/ws")
      return new Response("ok", { status: 200 });

    if (req.headers.get("Upgrade") !== "websocket")
      return new Response("Expected WebSocket", { status: 400 });

    const [client, server] = Object.values(new WebSocketPair());
    server.accept();

    server.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "JOIN" && typeof msg.room === "string") {
          joinRoom(server, msg.room);
          server.send(JSON.stringify({ type: "JOINED", room: msg.room }));
          return;
        }
        // Everything else (OFFER, ANSWER, ICE, etc.) gets fanned out
        fanout(server, ev.data);
      } catch {
        // ignore parse errors
      }
    });

    server.addEventListener("close", () => {
      leaveRoom(server);
    });
    server.addEventListener("error", () => {
      leaveRoom(server);
    });

    return new Response(null, { status: 101, webSocket: client });
  }
};
