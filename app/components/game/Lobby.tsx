import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, generateRoomCode, ref, get, set, update, onValue, off } from "./firebase";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";

function withTimeout<T>(promise: Promise<T>, timeoutMs = 3000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Connection timed out.")), timeoutMs)
    )
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// PROPS & TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface LobbyProps {
  onGameStart: (
    roomId: string,
    playerId: string,
    isHost: boolean,
    initialPlayers: LobbyPlayer[]
  ) => void;
  onBackToMainMenu: () => void;
}

interface LobbyPlayer {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
}

interface RoomData {
  id: string;
  status: string;
  private: boolean;
  creator: string;
  players: Record<string, LobbyPlayer>;
}

export const Lobby = ({ onGameStart, onBackToMainMenu }: LobbyProps) => {
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);

  const [activeTab, setActiveTab] = useState<"lobby" | "room">("lobby");
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  
  const [roomPlayers, setRoomPlayers] = useState<LobbyPlayer[]>([]);
  const [isRoomHost, setIsRoomHost] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDemoPrivate, setIsDemoPrivate] = useState(false);

  // ── Load or Create Player Identity ───────────────────────────────────────
  useEffect(() => {
    let savedId = localStorage.getItem("cb_player_id");
    let savedName = localStorage.getItem("cb_player_name");

    if (!savedId) {
      savedId = "player_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("cb_player_id", savedId);
    }
    setPlayerId(savedId);

    if (savedName) {
      setPlayerName(savedName);
      setNameSubmitted(true);
    }

    // Auto-join if URL parameter exists
    const searchParams = new URLSearchParams(window.location.search);
    const roomParam = searchParams.get("room");
    if (roomParam && savedName) {
      const code = roomParam.trim().toUpperCase();
      setInputCode(code);
      setLoading(true);
      joinRoom(code, false, savedId, savedName)
        .catch((err) => console.error("Auto-join failed:", err))
        .finally(() => setLoading(false));
    } else if (roomParam) {
      setInputCode(roomParam.toUpperCase());
    }
  }, []);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    localStorage.setItem("cb_player_name", playerName.trim());
    setNameSubmitted(true);

    const searchParams = new URLSearchParams(window.location.search);
    const roomParam = searchParams.get("room");
    if (roomParam) {
      const code = roomParam.trim().toUpperCase();
      setLoading(true);
      joinRoom(code, false, playerId, playerName.trim())
        .catch((err) => console.error("Auto-join failed:", err))
        .finally(() => setLoading(false));
    }
  };

  // ── Firebase Realtime Sync for Rooms ─────────────────────────────────────
  useEffect(() => {
    if (!roomCode || isDemoMode) return;

    const roomRef = ref(db, `rooms/${roomCode}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        setErrorMessage("Room no longer exists.");
        leaveRoom();
        return;
      }

      const data = snapshot.val() as RoomData;
      
      // Convert players dictionary to array
      const playersList = data.players
        ? Object.values(data.players)
        : [];

      // If room has started playing, trigger callbacks
      if (data.status === "playing" || data.status === "bidding") {
        onGameStart(roomCode, playerId, isRoomHost, playersList);
        return;
      }

      setRoomPlayers(playersList);

      // Check host state
      const me = playersList.find((p) => p.id === playerId);
      if (me) {
        setIsReady(me.isReady);
        setIsRoomHost(me.isHost);
      } else {
        // I was kicked or left
        setActiveTab("lobby");
        setRoomCode("");
      }
    });

    return () => {
      off(roomRef, "value", unsubscribe);
    };
  }, [roomCode, playerId, isDemoMode]);

  // ── Simulated User Joining Effect (Demo Mode) ───────────────────────────
  useEffect(() => {
    if (!isDemoMode || !roomCode || isDemoPrivate) return;

    const guests = [
      { id: "bot_rohan", name: "Rohan_Pro", isReady: false, isHost: false },
      { id: "bot_sneha", name: "Sneha_Star", isReady: false, isHost: false },
      { id: "bot_aman", name: "Aman_Ace", isReady: false, isHost: false }
    ];

    const timers: NodeJS.Timeout[] = [];

    // Guest 1 joins
    timers.push(setTimeout(() => {
      setRoomPlayers(prev => [...prev, guests[0]]);
    }, 1200));

    // Guest 1 readies
    timers.push(setTimeout(() => {
      setRoomPlayers(prev => prev.map(p => p.id === "bot_rohan" ? { ...p, isReady: true } : p));
    }, 2400));

    // Guest 2 joins
    timers.push(setTimeout(() => {
      setRoomPlayers(prev => [...prev, guests[1]]);
    }, 3200));

    // Guest 2 readies
    timers.push(setTimeout(() => {
      setRoomPlayers(prev => prev.map(p => p.id === "bot_sneha" ? { ...p, isReady: true } : p));
    }, 4000));

    // Guest 3 joins
    timers.push(setTimeout(() => {
      setRoomPlayers(prev => [...prev, guests[2]]);
    }, 4800));

    // Guest 3 readies
    timers.push(setTimeout(() => {
      setRoomPlayers(prev => prev.map(p => p.id === "bot_aman" ? { ...p, isReady: true } : p));
    }, 5600));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isDemoMode, roomCode]);

  // ── Auto Start for Quick Match in Demo Mode ──────────────────────────────
  useEffect(() => {
    if (isDemoMode && !isDemoPrivate && roomPlayers.length === 4 && roomPlayers.every(p => p.isReady)) {
      const autoStartTimer = setTimeout(() => {
        onGameStart(roomCode, playerId, isRoomHost, roomPlayers);
      }, 1000);
      return () => clearTimeout(autoStartTimer);
    }
  }, [isDemoMode, isDemoPrivate, roomPlayers, roomCode, playerId, isRoomHost, onGameStart]);

  // ── Simulated Creator Start (Demo Mode - Guest Side) ────────────────────
  useEffect(() => {
    if (isDemoMode && !isRoomHost && isReady) {
      const timers: NodeJS.Timeout[] = [];
      
      // Simulate bots joining after guest readies
      timers.push(setTimeout(() => {
        setRoomPlayers(prev => {
          if (prev.length >= 4) return prev;
          return [
            ...prev,
            { id: "bot_rohan", name: "Rohan_Pro", isReady: true, isHost: false },
            { id: "bot_sneha", name: "Sneha_Star", isReady: true, isHost: false }
          ];
        });
      }, 1200));

      // Simulate host starting the game
      timers.push(setTimeout(() => {
        setRoomPlayers(prev => {
          const finalPlayers = prev.length < 4 ? [
            ...prev,
            { id: "bot_rohan", name: "Rohan_Pro", isReady: true, isHost: false },
            { id: "bot_sneha", name: "Sneha_Star", isReady: true, isHost: false }
          ].slice(0, 4) : prev;
          
          onGameStart(roomCode, playerId, isRoomHost, finalPlayers);
          return finalPlayers;
        });
      }, 2400));

      return () => timers.forEach(clearTimeout);
    }
  }, [isDemoMode, isRoomHost, isReady, roomCode, playerId, onGameStart]);

  // ── BroadcastChannel Sync for Demo Mode Lobby ──────────────────────────
  useEffect(() => {
    if (!isDemoMode || !roomCode) return;

    const channel = new BroadcastChannel(`cb_demo_${roomCode}`);

    channel.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;

      if (isRoomHost) {
        if (msg.type === "join") {
          setRoomPlayers((prev) => {
            if (prev.some((p) => p.id === msg.player.id)) return prev;
            if (prev.length >= 4) return prev;
            const updated = [...prev, msg.player];
            channel.postMessage({ type: "players", players: updated });
            return updated;
          });
        } else if (msg.type === "ready") {
          setRoomPlayers((prev) => {
            const updated = prev.map((p) =>
              p.id === msg.playerId ? { ...p, isReady: msg.isReady } : p
            );
            channel.postMessage({ type: "players", players: updated });
            return updated;
          });
        } else if (msg.type === "leave") {
          setRoomPlayers((prev) => {
            const updated = prev.filter((p) => p.id !== msg.playerId);
            channel.postMessage({ type: "players", players: updated });
            return updated;
          });
        }
      } else {
        if (msg.type === "players") {
          setRoomPlayers(msg.players);
        } else if (msg.type === "start") {
          onGameStart(roomCode, playerId, isRoomHost, msg.players);
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [isDemoMode, roomCode, isRoomHost, playerId, onGameStart]);

  // Guest join broadcast on mount
  useEffect(() => {
    if (isDemoMode && !isRoomHost && roomCode) {
      const channel = new BroadcastChannel(`cb_demo_${roomCode}`);
      channel.postMessage({
        type: "join",
        player: { id: playerId, name: playerName, isReady: false, isHost: false },
      });
      channel.close();
    }
  }, [isDemoMode, isRoomHost, roomCode, playerId, playerName]);

  const startDemoRoom = (isPrivate: boolean) => {
    setIsDemoMode(true);
    setIsDemoPrivate(isPrivate);
    const code = "DEMO-" + generateRoomCode().slice(0, 3);
    setRoomCode(code);
    setIsRoomHost(true);
    setIsReady(true);
    setRoomPlayers([{ id: playerId, name: playerName, isReady: true, isHost: true }]);
    setActiveTab("room");
  };

  // ── Quick Match Matchmaking ──────────────────────────────────────────────
  const handleQuickMatch = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const roomsRef = ref(db, "rooms");
      const snapshot = await withTimeout(get(roomsRef));
      let targetRoomCode = "";

      if (snapshot.exists()) {
        const rooms = snapshot.val() as Record<string, RoomData>;
        // Find public, waiting room with < 4 players
        const availableRoom = Object.values(rooms).find(
          (r) =>
            !r.private &&
            r.status === "waiting" &&
            r.players &&
            Object.keys(r.players).length < 4
        );
        if (availableRoom) {
          targetRoomCode = availableRoom.id;
        }
      }

      if (targetRoomCode) {
        // Join existing room
        await joinRoom(targetRoomCode, false);
      } else {
        // Create new public room
        await createRoom(false);
      }
    } catch (err: any) {
      console.error(err);
      startDemoRoom(false);
    } finally {
      setLoading(false);
    }
  };

  // ── Create Private Room ──────────────────────────────────────────────────
  const handleCreatePrivateTable = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      await createRoom(true);
    } catch (err: any) {
      console.error(err);
      startDemoRoom(true);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async (isPrivate: boolean) => {
    const newCode = generateRoomCode();
    const roomRef = ref(db, `rooms/${newCode}`);
    
    const mySelf: LobbyPlayer = {
      id: playerId,
      name: playerName,
      isReady: true,
      isHost: true
    };

    const newRoom: RoomData = {
      id: newCode,
      status: "waiting",
      private: isPrivate,
      creator: playerId,
      players: {
        [playerId]: mySelf
      }
    };

    await withTimeout(set(roomRef, newRoom));
    setRoomCode(newCode);
    setIsRoomHost(true);
    setIsReady(true);
    setActiveTab("room");
  };

  // ── Join Existing Room ───────────────────────────────────────────────────
  const handleJoinByCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCode.trim()) return;

    const code = inputCode.trim().toUpperCase();
    setLoading(true);
    setErrorMessage("");

    try {
      await joinRoom(code, false);
    } catch (err: any) {
      console.error(err);
      if (code.startsWith("DEMO") || err.message.includes("timed out") || err.message.includes("Connection")) {
        setIsDemoMode(true);
        setIsDemoPrivate(true);
        setRoomCode(code.startsWith("DEMO") ? code : "DEMO-INV");
        setIsRoomHost(false);
        setIsReady(false);
        setRoomPlayers([
          { id: "player_creator", name: "HostPlayer", isReady: true, isHost: true },
          { id: playerId, name: playerName, isReady: false, isHost: false }
        ]);
        setActiveTab("room");
      } else {
        setErrorMessage(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (code: string, isHost: boolean, overrideId?: string, overrideName?: string) => {
    const roomRef = ref(db, `rooms/${code}`);
    const snapshot = await withTimeout(get(roomRef));

    if (!snapshot.exists()) {
      throw new Error("Room code not found.");
    }

    const data = snapshot.val() as RoomData;
    if (data.status !== "waiting") {
      throw new Error("Game has already started.");
    }

    const playersCount = data.players ? Object.keys(data.players).length : 0;
    if (playersCount >= 4) {
      throw new Error("Room is already full (max 4 players).");
    }

    const activeId = overrideId || playerId;
    const activeName = overrideName || playerName;

    const mySelf: LobbyPlayer = {
      id: activeId,
      name: activeName,
      isReady: false,
      isHost: isHost
    };

    // Add to players list
    await withTimeout(set(ref(db, `rooms/${code}/players/${activeId}`), mySelf));
    setRoomCode(code);
    setIsRoomHost(isHost);
    setIsReady(false);
    setActiveTab("room");

    // Clean query params so user doesn't join on subsequent refreshes
    if (window.location.search.includes("room")) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // ── Leave Room ───────────────────────────────────────────────────────────
  const leaveRoom = async () => {
    if (!roomCode) return;

    if (isDemoMode) {
      if (!isRoomHost) {
        const channel = new BroadcastChannel(`cb_demo_${roomCode}`);
        channel.postMessage({ type: "leave", playerId: playerId });
        channel.close();
      }
      setIsDemoMode(false);
      setIsDemoPrivate(false);
      setRoomCode("");
      setIsRoomHost(false);
      setIsReady(false);
      setRoomPlayers([]);
      setActiveTab("lobby");
      return;
    }

    try {
      const roomRef = ref(db, `rooms/${roomCode}`);
      const snapshot = await withTimeout(get(roomRef));
      if (snapshot.exists()) {
        const data = snapshot.val() as RoomData;
        const playersList = Object.keys(data.players || {});

        if (playersList.length <= 1) {
          // Delete room if I am the last player
          await withTimeout(set(roomRef, null));
        } else {
          // Remove myself
          await withTimeout(set(ref(db, `rooms/${roomCode}/players/${playerId}`), null));
          // Handover host status if I was the host
          if (isRoomHost) {
            const nextHostId = playersList.find((id) => id !== playerId);
            if (nextHostId) {
              await withTimeout(update(ref(db, `rooms/${roomCode}/players/${nextHostId}`), {
                isHost: true,
                isReady: true // Host is always ready
              }));
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    setRoomCode("");
    setIsRoomHost(false);
    setIsReady(false);
    setRoomPlayers([]);
    setActiveTab("lobby");
  };

  // ── Toggle Ready Status ──────────────────────────────────────────────────
  const toggleReady = async () => {
    if (isRoomHost) return; // Host is always ready
    const newReady = !isReady;
    setIsReady(newReady);

    if (isDemoMode) {
      setRoomPlayers(prev => prev.map(p => p.id === playerId ? { ...p, isReady: newReady } : p));
      const channel = new BroadcastChannel(`cb_demo_${roomCode}`);
      channel.postMessage({ type: "ready", playerId: playerId, isReady: newReady });
      channel.close();
      return;
    }

    try {
      await withTimeout(update(ref(db, `rooms/${roomCode}/players/${playerId}`), {
        isReady: newReady
      }));
    } catch (err: any) {
      setErrorMessage("Firebase update failed: " + err.message);
    }
  };

  // ── Fill Room with Bots ──────────────────────────────────────────────────
  const handleAddBots = async () => {
    if (!isRoomHost || roomPlayers.length >= 4) return;

    const botNames = ["Rohan", "Sneha", "Aman", "Priya"];
    const currentBotNames = roomPlayers.map((p) => p.name);
    const availableNames = botNames.filter((name) => !currentBotNames.includes(name));

    const needed = 4 - roomPlayers.length;

    if (isDemoMode) {
      const newBots: LobbyPlayer[] = [];
      for (let i = 0; i < needed; i++) {
        const botId = `bot_${Math.random().toString(36).substr(2, 9)}`;
        const botName = availableNames[i] || `Bot_${i + 1}`;
        newBots.push({
          id: botId,
          name: botName,
          isReady: true,
          isHost: false
        });
      }
      setRoomPlayers(prev => [...prev, ...newBots]);
      return;
    }

    const updates: Record<string, LobbyPlayer> = {};

    for (let i = 0; i < needed; i++) {
      const botId = `bot_${Math.random().toString(36).substr(2, 9)}`;
      const botName = availableNames[i] || `Bot_${i + 1}`;
      updates[botId] = {
        id: botId,
        name: botName,
        isReady: true,
        isHost: false
      };
    }

    try {
      await withTimeout(update(ref(db, `rooms/${roomCode}/players`), updates));
    } catch (err: any) {
      setErrorMessage("Firebase update failed: " + err.message);
    }
  };

  // ── Start Multiplayer Game ───────────────────────────────────────────────
  const handleStartGame = async () => {
    if (!isRoomHost) return;

    // Check if all joined human players are ready
    const unready = roomPlayers.filter((p) => !p.id.startsWith("bot_") && p.id !== playerId && !p.isReady);
    if (unready.length > 0) {
      setErrorMessage("Not all players are ready yet.");
      return;
    }

    // Auto-fill remaining slots with bots up to 4 players
    let finalPlayers = [...roomPlayers];
    if (finalPlayers.length < 4) {
      const botNames = ["Rohan", "Sneha", "Aman", "Priya"];
      const currentNames = finalPlayers.map((p) => p.name);
      const availableNames = botNames.filter((name) => !currentNames.includes(name));
      const needed = 4 - finalPlayers.length;

      const newBots: LobbyPlayer[] = [];
      for (let i = 0; i < needed; i++) {
        const botId = `bot_${Math.random().toString(36).substr(2, 9)}`;
        const botName = availableNames[i] || `Bot_${i + 1}`;
        newBots.push({
          id: botId,
          name: botName,
          isReady: true,
          isHost: false
        });
      }
      finalPlayers = [...finalPlayers, ...newBots];

      if (!isDemoMode) {
        try {
          const updates: Record<string, LobbyPlayer> = {};
          newBots.forEach(b => {
            updates[b.id] = b;
          });
          await withTimeout(update(ref(db, `rooms/${roomCode}/players`), updates));
        } catch (err: any) {
          console.error("Failed to sync bots to Firebase:", err);
        }
      } else {
        setRoomPlayers(finalPlayers);
      }
    }

    if (isDemoMode) {
      const channel = new BroadcastChannel(`cb_demo_${roomCode}`);
      channel.postMessage({ type: "start", players: finalPlayers });
      channel.close();
      onGameStart(roomCode, playerId, isRoomHost, finalPlayers);
      return;
    }

    try {
      await withTimeout(update(ref(db, `rooms/${roomCode}`), {
        status: "playing"
      }));
    } catch (err: any) {
      setErrorMessage("Firebase update failed: " + err.message);
    }
  };

  const copyInviteLink = () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Share Invite Link (WhatsApp / Web Share API) ─────────────────────────
  const handleShare = async () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    const shareText = `Join my table to play Minus Plus card game! Click here to join: ${inviteUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Play Minus Plus Card Game!",
          text: "Join my table to play Minus Plus with me!",
          url: inviteUrl,
        });
      } catch (err) {
        console.log("Error using Web Share API:", err);
      }
    } else {
      window.open(whatsappUrl, "_blank");
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative"
      style={{
        background: "radial-gradient(ellipse at center, #001f3f 0%, #000c18 80%)",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background glow animations */}
      <div className="absolute top-[10%] left-[20%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <Logo compact={false} />

      <div className="w-full max-w-md mt-6">
        <AnimatePresence mode="wait">
          {/* STEP 1: ENTER NAME */}
          {!nameSubmitted ? (
            <motion.div
              key="name-form"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-blue-500/20 shadow-2xl shadow-blue-500/10"
            >
              <h2 className="text-xl font-black text-white text-center mb-4">
                {typeof window !== "undefined" && new URLSearchParams(window.location.search).has("room")
                  ? "You are Invited! Accept the Invite"
                  : "What's your Player Nickname?"}
              </h2>
              <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
                <input
                  type="text"
                  maxLength={15}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter Name..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 text-white font-bold border border-slate-700 focus:border-blue-500 outline-none text-center text-lg"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!playerName.trim()}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-lg shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none cursor-pointer"
                >
                  {typeof window !== "undefined" && new URLSearchParams(window.location.search).has("room")
                    ? "ACCEPT INVITE"
                    : "CONTINUE"}
                </button>
                <button
                  type="button"
                  onClick={onBackToMainMenu}
                  className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-400 font-bold text-sm hover:bg-slate-800/50 transition-all cursor-pointer"
                >
                  Back to Main Menu
                </button>
              </form>
            </motion.div>
          ) : activeTab === "lobby" ? (
            /* STEP 2: LOBBY LOBBY MENU */
            <motion.div
              key="lobby-menu"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-blue-500/20 shadow-2xl shadow-blue-500/10 flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center font-bold text-blue-400 text-sm">
                    {playerName.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-white font-bold text-base">{playerName}</span>
                </div>
                <button
                  onClick={() => setNameSubmitted(false)}
                  className="text-xs text-blue-400 hover:underline cursor-pointer"
                >
                  Edit Name
                </button>
              </div>

              {errorMessage && (
                <div className="px-3 py-2 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm rounded-lg text-center font-semibold">
                  {errorMessage}
                </div>
              )}

              <button
                disabled={loading}
                onClick={handleQuickMatch}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-lg shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Matching..." : "⚡ QUICK MATCH"}
              </button>

              <button
                disabled={loading}
                onClick={handleCreatePrivateTable}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-base shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                👥 CREATE PRIVATE TABLE
              </button>

              <div className="my-2 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-slate-500 text-xs font-black">OR JOIN CODE</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              <form onSubmit={handleJoinByCode} className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="CODE (e.g. AB12XY)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 text-white font-bold border border-slate-700 focus:border-blue-500 outline-none text-center"
                />
                <button
                  type="submit"
                  disabled={loading || inputCode.length < 6}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 border border-blue-500/30 hover:border-blue-400 font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Join
                </button>
              </form>

              <div className="text-center mt-1">
                <button
                  type="button"
                  onClick={() => startDemoRoom(false)}
                  className="text-xs text-slate-500 hover:text-slate-400 font-medium underline cursor-pointer"
                >
                  ⚠️ Firebase offline? Play in Demo Mode (Simulated Online)
                </button>
              </div>

              <button
                onClick={onBackToMainMenu}
                className="w-full mt-2 py-2.5 rounded-xl border border-slate-800 text-slate-500 hover:text-slate-400 font-bold text-sm transition-all cursor-pointer"
              >
                ← Back to Main Menu
              </button>
            </motion.div>
          ) : (
            /* STEP 3: INSIDE ROOM VIEW */
            <motion.div
              key="room-view"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-blue-500/20 shadow-2xl shadow-blue-500/10 flex flex-col gap-4"
            >
              <div className="text-center">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-black">
                  Table Invite Code
                </span>
                <div className="flex items-center justify-center gap-2.5 mt-1">
                  <span className="text-2xl font-black text-white tracking-widest">
                    {roomCode}
                  </span>
                  <button
                    onClick={copyInviteLink}
                    className="p-1.5 rounded-lg bg-slate-800 text-blue-400 border border-slate-700 hover:text-blue-300 transition-all cursor-pointer"
                    title="Copy invite URL"
                  >
                    <svg
                      width={16}
                      height={16}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <rect x={9} y={9} width={13} height={13} rx={2} ry={2} />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>
                {copied && (
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1">
                    Invite URL copied to clipboard!
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleShare}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-blue-500/20 active:scale-95 text-sm"
                >
                  <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" className="shrink-0">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  INVITE A FRIEND
                </button>
              </div>

              {errorMessage && (
                <div className="px-3 py-2 bg-rose-500/15 border border-rose-500/30 text-rose-400 text-sm rounded-lg text-center font-semibold">
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-col gap-2.5 my-2">
                <span className="text-xs text-slate-500 uppercase tracking-widest font-black">
                  Joined Players ({roomPlayers.length} / 4)
                </span>
                
                {/* 4 Player Slots */}
                {Array.from({ length: 4 }).map((_, idx) => {
                  const player = roomPlayers[idx];
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border"
                      style={{
                        background: player ? "rgba(30, 41, 59, 0.4)" : "rgba(30, 41, 59, 0.1)",
                        borderColor: player
                          ? player.isHost
                            ? "rgba(250, 204, 21, 0.25)"
                            : "rgba(59, 130, 246, 0.2)"
                          : "rgba(255, 255, 255, 0.05)"
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {player ? (
                          <Avatar id={player.id} name={player.name} size={32} />
                        ) : (
                          <div className="w-8 h-8 rounded-full border border-dashed border-slate-700 flex items-center justify-center text-slate-600 text-xs">
                            ?
                          </div>
                        )}
                        <span
                          className={`font-semibold text-sm ${
                            player ? "text-white" : "text-slate-600"
                          }`}
                        >
                          {player ? player.name : "Waiting for player..."}
                        </span>
                      </div>
                      
                      {player && (
                        <div className="flex items-center gap-2">
                          {player.isHost && (
                            <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 text-[10px] font-black border border-yellow-500/20">
                              HOST
                            </span>
                          )}
                          {!player.isHost && (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                player.isReady
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-slate-800 text-slate-500 border-slate-700"
                              }`}
                            >
                              {player.isReady ? "READY" : "NOT READY"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* HOST CONTROLS */}
              {isRoomHost ? (
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    onClick={handleStartGame}
                    disabled={roomPlayers.filter((p) => !p.id.startsWith("bot_") && p.id !== playerId).some((p) => !p.isReady)}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-lg shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
                  >
                    🚀 START GAME
                  </button>
                </div>
              ) : (
                /* GUEST CONTROLS */
                <button
                  onClick={toggleReady}
                  className={`w-full mt-2 py-4 rounded-xl font-black text-lg shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    isReady
                      ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20 text-white"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20 text-white"
                  }`}
                >
                  {isReady ? "❌ UNREADY" : "✅ READY TO PLAY"}
                </button>
              )}

              <button
                onClick={leaveRoom}
                className="w-full mt-1 py-2.5 rounded-xl border border-slate-800 text-slate-500 hover:text-slate-400 font-bold text-sm transition-all cursor-pointer"
              >
                ← Leave Table
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
