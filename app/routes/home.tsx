"use client";

import { useState, useEffect } from "react";
import HomeComponent from "~/components/home";
import FirstPage from "~/components/FirstPage";
import { Lobby } from "~/components/game/Lobby";

type ScreenMode = "main_menu" | "lobby" | "offline_game" | "online_game";

export default function Home() {
  const [screen, setScreen] = useState<ScreenMode>("main_menu");
  const [multiplayerOpts, setMultiplayerOpts] = useState<{
    roomId: string;
    playerId: string;
    isHost: boolean;
    initialPlayers: any[];
  } | null>(null);

  // Auto-join room lobby if room ID is present in query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const roomParam = searchParams.get("room");
    if (roomParam) {
      setScreen("lobby");
    }
  }, []);

  const handleExitGame = () => {
    // Return to lobby if it was multiplayer, or main menu if offline
    if (multiplayerOpts) {
      setScreen("lobby");
    } else {
      setScreen("main_menu");
    }
  };

  if (screen === "offline_game") {
    return <HomeComponent onExit={handleExitGame} />;
  }

  if (screen === "online_game" && multiplayerOpts) {
    return (
      <HomeComponent
        multiplayerOpts={multiplayerOpts}
        onExit={handleExitGame}
      />
    );
  }

  if (screen === "lobby") {
    return (
      <Lobby
        onGameStart={(roomId, playerId, isHost, initialPlayers) => {
          setMultiplayerOpts({ roomId, playerId, isHost, initialPlayers });
          setScreen("online_game");
        }}
        onBackToMainMenu={() => setScreen("main_menu")}
      />
    );
  }

  // Default: Main Menu (FirstPage)
  return (
    <FirstPage
      onPlayOffline={() => setScreen("offline_game")}
      onPlayOnline={() => setScreen("lobby")}
    />
  );
}