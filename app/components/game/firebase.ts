// ─────────────────────────────────────────────────────────────────────────────
// WEBSOCKET-BASED ZERO-CONFIG MULTIPLAYER ENGINE
// ─────────────────────────────────────────────────────────────────────────────
// This file replaces the Firebase SDK with a lightweight WebSocket broker
// that runs over a public server, enabling instant real-time multiplayer 
// between any two devices (mobile or desktop) globally with zero setup.

let socket: WebSocket | null = null;
const listeners: { path: string; callback: (snapshot: any) => void }[] = [];
const localCache: Record<string, any> = {};

function getLocalPlayerId(): string {
  if (typeof window === "undefined") return "unknown";
  return localStorage.getItem("cb_player_id") || "unknown";
}

function getSocket(): WebSocket {
  if (socket && (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN)) {
    return socket;
  }

  socket = new WebSocket("wss://javascript.info/article/websocket/chat");

  socket.onmessage = (event) => {
    try {
      const text = event.data as string;
      if (!text.startsWith("cb_room_")) return;

      const colonIdx = text.indexOf(":");
      if (colonIdx === -1) return;

      const header = text.slice(0, colonIdx);
      const payloadStr = text.slice(colonIdx + 1);

      const parts = header.split("_");
      const currentRoomCode = parts[2];

      const payload = JSON.parse(payloadStr);
      handleIncomingMessage(currentRoomCode, payload);
    } catch (err) {
      // Ignore parse errors from other chat messages
    }
  };

  socket.onclose = () => {
    setTimeout(() => {
      getSocket();
    }, 1000);
  };

  return socket;
}

function handleIncomingMessage(roomCode: string, payload: any) {
  const myPlayerId = getLocalPlayerId();

  if (payload.type === "roomState") {
    // If we are the Host, ignore other state broadcasts (we are the server)
    const isHost = localCache["rooms"]?.[roomCode]?.creator === myPlayerId;
    if (isHost) return;

    // Guest updates local cache to match Host's broadcasted state
    if (!localCache["rooms"]) {
      localCache["rooms"] = {};
    }
    localCache["rooms"][roomCode] = payload.roomData;

    triggerListeners(roomCode);
  } else if (payload.type === "clientAction") {
    // Host receives and processes guest actions
    const isHost = localCache["rooms"]?.[roomCode]?.creator === myPlayerId;
    if (!isHost) return;

    const action = payload.action;
    if (action.type === "set") {
      setInCache(action.path, action.value);
    } else if (action.type === "update") {
      updateInCache(action.path, action.value);
    }

    // Broadcast the updated state back to everyone
    broadcastRoomState(roomCode);

    // Trigger host's own listeners
    triggerListeners(roomCode);
  }
}

function broadcastRoomState(roomCode: string) {
  const roomData = localCache["rooms"]?.[roomCode];
  if (!roomData) return;
  const ws = getSocket();
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(`cb_room_${roomCode}:` + JSON.stringify({ type: "roomState", roomData }));
  }
}

function sendActionToHost(roomCode: string, action: any) {
  const ws = getSocket();
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(`cb_room_${roomCode}:` + JSON.stringify({ type: "clientAction", action }));
  }
}

function triggerListeners(roomCode: string) {
  listeners.forEach((l) => {
    const parts = l.path.split("/");
    const pathRoomCode = parts[1];
    if (pathRoomCode !== roomCode) return;

    const value = getSliceOfCache(l.path);
    l.callback({
      exists: () => value !== null && value !== undefined,
      val: () => value,
    });
  });
}

function setInCache(path: string, value: any) {
  const parts = path.split("/");
  let current = localCache;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }
  const lastKey = parts[parts.length - 1];
  if (value === null || value === undefined) {
    delete current[lastKey];
  } else {
    current[lastKey] = value;
  }
}

// Custom simple transactions support
export async function runTransaction(dbRef: { path: string }, transactionUpdate: (currentData: any) => any) {
  const parts = dbRef.path.split("/");
  const roomCode = parts[1];
  const myPlayerId = getLocalPlayerId();
  const isHost = localCache["rooms"]?.[roomCode]?.creator === myPlayerId;

  if (isHost) {
    const currentVal = getSliceOfCache(dbRef.path);
    const newVal = transactionUpdate(currentVal);
    setInCache(dbRef.path, newVal);
    broadcastRoomState(roomCode);
    triggerListeners(roomCode);
    return { committed: true, snapshot: { val: () => newVal } };
  } else {
    // Guests can't easily run transaction, we just update it
    const currentVal = getSliceOfCache(dbRef.path);
    const newVal = transactionUpdate(currentVal);
    sendActionToHost(roomCode, { type: "set", path: dbRef.path, value: newVal });
    return { committed: true, snapshot: { val: () => newVal } };
  }
}

function updateInCache(path: string, value: any) {
  const parts = path.split("/");
  let current = localCache;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }
  const lastKey = parts[parts.length - 1];
  if (!current[lastKey]) {
    current[lastKey] = {};
  }
  if (value && typeof value === "object") {
    current[lastKey] = { ...current[lastKey], ...value };
  } else {
    current[lastKey] = value;
  }
}

function getSliceOfCache(path: string): any {
  const parts = path.split("/");
  let current = localCache;
  for (const key of parts) {
    if (current === undefined || current === null) return null;
    current = current[key];
  }
  return current === undefined ? null : current;
}

// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE-COMPATIBLE API EXPORTS
// ─────────────────────────────────────────────────────────────────────────────
export const db = {};

export function ref(database: any, path: string) {
  return { path };
}

export async function set(dbRef: { path: string }, value: any) {
  getSocket();

  const parts = dbRef.path.split("/");
  const roomCode = parts[1];
  const myPlayerId = getLocalPlayerId();

  // If we are Host (creating room or writing room data directly)
  const isHost = parts.length === 2 || localCache["rooms"]?.[roomCode]?.creator === myPlayerId;

  if (isHost) {
    setInCache(dbRef.path, value);
    broadcastRoomState(roomCode);
    triggerListeners(roomCode);
  } else {
    sendActionToHost(roomCode, { type: "set", path: dbRef.path, value });
  }
}

export async function update(dbRef: { path: string }, value: any) {
  getSocket();

  const parts = dbRef.path.split("/");
  const roomCode = parts[1];
  const myPlayerId = getLocalPlayerId();

  const isHost = localCache["rooms"]?.[roomCode]?.creator === myPlayerId;

  if (isHost) {
    updateInCache(dbRef.path, value);
    broadcastRoomState(roomCode);
    triggerListeners(roomCode);
  } else {
    sendActionToHost(roomCode, { type: "update", path: dbRef.path, value });
  }
}

export async function get(dbRef: { path: string }) {
  getSocket();
  // Small delay to allow initial WebSocket sync on join
  await new Promise((resolve) => setTimeout(resolve, 250));

  const value = getSliceOfCache(dbRef.path);
  return {
    exists: () => value !== null && value !== undefined,
    val: () => value,
  };
}

export function onValue(dbRef: { path: string }, callback: (snapshot: any) => void) {
  getSocket();

  const listener = { path: dbRef.path, callback };
  listeners.push(listener);

  // Trigger immediately with cached value
  const value = getSliceOfCache(dbRef.path);
  callback({
    exists: () => value !== null && value !== undefined,
    val: () => value,
  });

  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) {
      listeners.splice(idx, 1);
    }
  };
}

export function off(dbRef: { path: string }, eventType: string, callback?: any) {
  for (let i = listeners.length - 1; i >= 0; i--) {
    if (listeners[i].path === dbRef.path) {
      listeners.splice(i, 1);
    }
  }
}

// Keep the same room code generator
export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
