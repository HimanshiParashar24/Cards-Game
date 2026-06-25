export type SoundName =
  | "cardPlay"
  | "trickWin"
  | "bidPlaced"
  | "roundEnd"
  | "gameWin"
  | "gameLose"
  | "shuffle"
  | "toast";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playSound(name: SoundName) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    switch (name) {
      case "cardPlay": {
        const audio = new Audio("/CardsT.mp3");
        audio.onloadeddata = () => {};
        audio.onerror = () => {};
        audio.play()
          .then(() => console.log("audio playing"))
          .catch((err) => console.log("play failed", err));
        break;
      }
      case "trickWin": {
        console.log("NEW TRICK WIN SOUND");
        const audio = new Audio("/sound/TrickW.wav");
        audio.volume = 0.8;
        audio.play().catch(console.error);
        break;
      }
      case "bidPlaced": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(660, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case "roundEnd": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(800, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }
      case "gameWin": {
        const audio = new Audio("/sound/WinS.wav");
        audio.volume = 1;
        audio.loop = true;
        audio.play().catch(console.error);
        setTimeout(() => {
          audio.pause();
          audio.currentTime = 0;
        }, 10000);
        break;
      }
      case "gameLose": {
        const audio = new Audio("/sound/LoseS.wav");
        audio.volume = 1;
        audio.play().catch(console.error);
        break;
      }
      case "shuffle": {
        console.log("shuffle called");
        const audio = new Audio("/sound/shufflesound.mp3");
        audio.play().catch(console.error);
        break;
      }
      case "toast": {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1100, now + 0.05);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
    }
  } catch {
    // Audio not supported or blocked
  }
}
