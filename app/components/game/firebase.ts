// ─────────────────────────────────────────────────────────────────────────────
// NTFY.SH PUBLIC BROKER MULTIPLAYER ENGINE
// ─────────────────────────────────────────────────────────────────────────────
// This file replaces the Firebase SDK with a lightweight pub/sub sync engine
// over the free public broker ntfy.sh. It connects host and guest devices 
// instantly across mobile networks, Wi-Fi, and desktop browsers globally.

const listeners: { path: string; callback: (snapshot: any) => void }[] = [];
const localCache: Record<string, any> = {};
const pendingRequests: { path: string; resolve: (val: any) => void }[] = [];
const processedActionIds = new Set<string>();

let stateSocket: WebSocket | null = null;
let actionsSocket: WebSocket | null = null;

function getLocalPlayerId(): string {
  if (typeof window === "undefined") return "unknown";
  return localStorage.getItem("cb_player_id") || "unknown";
}

function connectStateSocket(roomCode: string) {
  if (stateSocket && stateSocket.readyState !== WebSocket.CLOSED) return;

  // Guests connect with since=all to immediately load the last cached state
  stateSocket = new WebSocket(`wss://ntfy.sh/cb_room_${roomCode}_state/ws?since=all`);
  stateSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.event === "message") {
        const payload = JSON.parse(data.message);
        if (payload.type === "roomState") {
          const myPlayerId = getLocalPlayerId();
          const isHost = localCache["rooms"]?.[roomCode]?.creator === myPlayerId;
          if (isHost) return; // Host ignores state broadcasts

          if (!localCache["rooms"]) {
            localCache["rooms"] = {};
          }
          localCache["rooms"][roomCode] = payload.roomData;

          resolvePendingRequests(roomCode);
          triggerListeners(roomCode);
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  };
  stateSocket.onclose = () => {
    stateSocket = null;
    setTimeout(() => connectStateSocket(roomCode), 1000);
  };
}

function connectActionsSocket(roomCode: string) {
  if (actionsSocket && actionsSocket.readyState !== WebSocket.CLOSED) return;

  // Host connects with since=all to sync background guest joins when returning from WhatsApp
  actionsSocket = new WebSocket(`wss://ntfy.sh/cb_room_${roomCode}_actions/ws?since=all`);
  actionsSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.event === "message") {
        const payload = JSON.parse(data.message);
        const myPlayerId = getLocalPlayerId();
        const isHost = localCache["rooms"]?.[roomCode]?.creator === myPlayerId;
        if (!isHost) return;

        // Deduplicate cached guest actions
        if (payload.actionId) {
          if (processedActionIds.has(payload.actionId)) return;
          processedActionIds.add(payload.actionId);
        }

        if (payload.type === "request") {
          broadcastRoomState(roomCode);
        } else if (payload.type === "clientAction") {
          const action = payload.action;
          if (action.type === "set") {
            setInCache(action.path, action.value);
          } else if (action.type === "update") {
            updateInCache(action.path, action.value);
          }
          broadcastRoomState(roomCode);
          triggerListeners(roomCode);
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  };
  actionsSocket.onclose = () => {
    actionsSocket = null;
    setTimeout(() => connectActionsSocket(roomCode), 1000);
  };
}

function broadcastRoomState(roomCode: string) {
  const roomData = localCache["rooms"]?.[roomCode];
  if (!roomData) return;

  fetch(`https://ntfy.sh/cb_room_${roomCode}_state`, {
    method: "POST",
    body: JSON.stringify({ type: "roomState", roomData }),
    headers: {
      "Content-Type": "application/json"
    }
  }).catch((err) => console.error("Failed to broadcast state:", err));
}

function sendActionToHost(roomCode: string, action: any) {
  const actionId = "act_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now();
  fetch(`https://ntfy.sh/cb_room_${roomCode}_actions`, {
    method: "POST",
    body: JSON.stringify({ type: "clientAction", actionId, action }),
    headers: {
      "Content-Type": "application/json"
    }
  }).catch((err) => console.error("Failed to send action:", err));
}

function sendRequestToHost(roomCode: string) {
  fetch(`https://ntfy.sh/cb_room_${roomCode}_actions`, {
    method: "POST",
    body: JSON.stringify({ type: "request" }),
    headers: {
      "Content-Type": "application/json"
    }
  }).catch((err) => console.error("Failed to send request:", err));
}

function resolvePendingRequests(roomCode: string) {
  for (let i = pendingRequests.length - 1; i >= 0; i--) {
    const req = pendingRequests[i];
    const parts = req.path.split("/");
    if (parts[1] === roomCode) {
      const val = getSliceOfCache(req.path);
      if (val !== null && val !== undefined) {
        req.resolve(val);
        pendingRequests.splice(i, 1);
      }
    }
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
  const parts = dbRef.path.split("/");
  const roomCode = parts[1];
  const myPlayerId = getLocalPlayerId();

  // If we are Host (creating room or writing room data directly)
  const isHost = parts.length === 2 || localCache["rooms"]?.[roomCode]?.creator === myPlayerId;

  if (isHost) {
    connectActionsSocket(roomCode);
    connectStateSocket(roomCode);
    setInCache(dbRef.path, value);
    broadcastRoomState(roomCode);
    triggerListeners(roomCode);
  } else {
    connectStateSocket(roomCode);
    sendActionToHost(roomCode, { type: "set", path: dbRef.path, value });
  }
}

export async function update(dbRef: { path: string }, value: any) {
  const parts = dbRef.path.split("/");
  const roomCode = parts[1];
  const myPlayerId = getLocalPlayerId();

  const isHost = localCache["rooms"]?.[roomCode]?.creator === myPlayerId;

  if (isHost) {
    connectActionsSocket(roomCode);
    connectStateSocket(roomCode);
    updateInCache(dbRef.path, value);
    broadcastRoomState(roomCode);
    triggerListeners(roomCode);
  } else {
    connectStateSocket(roomCode);
    sendActionToHost(roomCode, { type: "update", path: dbRef.path, value });
  }
}

export async function get(dbRef: { path: string }) {
  const parts = dbRef.path.split("/");
  const roomCode = parts[1];

  const value = getSliceOfCache(dbRef.path);
  if (value !== null && value !== undefined) {
    return {
      exists: () => true,
      val: () => value,
    };
  }

  if (roomCode) {
    connectStateSocket(roomCode);
    // Request state from host
    sendRequestToHost(roomCode);
  }

  return new Promise<any>((resolve) => {
    const timeout = setTimeout(() => {
      const idx = pendingRequests.findIndex(r => r.path === dbRef.path && r.resolve === resolve);
      if (idx !== -1) pendingRequests.splice(idx, 1);
      resolve({
        exists: () => false,
        val: () => null,
      });
    }, 1800);

    pendingRequests.push({
      path: dbRef.path,
      resolve: (val) => {
        clearTimeout(timeout);
        resolve({
          exists: () => val !== null && val !== undefined,
          val: () => val,
        });
      },
    });
  });
}

export function onValue(dbRef: { path: string }, callback: (snapshot: any) => void) {
  const parts = dbRef.path.split("/");
  const roomCode = parts[1];
  const myPlayerId = getLocalPlayerId();

  if (roomCode) {
    const isHost = localCache["rooms"]?.[roomCode]?.creator === myPlayerId;
    if (isHost) {
      connectActionsSocket(roomCode);
    }
    connectStateSocket(roomCode);
  }

  const listener = { path: dbRef.path, callback };
  listeners.push(listener);

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
    const currentVal = getSliceOfCache(dbRef.path);
    const newVal = transactionUpdate(currentVal);
    sendActionToHost(roomCode, { type: "set", path: dbRef.path, value: newVal });
    return { committed: true, snapshot: { val: () => newVal } };
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
