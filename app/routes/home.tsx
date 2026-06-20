
"use client";

import { useState } from "react";
import HomeComponent from "~/components/home";
import FirstPage from "~/components/FirstPage";

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);

  return gameStarted ? (
    <HomeComponent />
  ) : (
    <FirstPage onPlay={() => setGameStarted(true)} />
  );
}