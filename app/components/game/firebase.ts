import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  onValue,
  off,
  update,
  get,
  child,
  runTransaction
} from "firebase/database";

// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────
// Note: If you want to use your own Firebase database, replace this configuration
// with your actual credentials from the Firebase Console (Console -> Project Settings).
// For the Realtime Database, make sure to set the Rules to:
// {
//   "rules": {
//     ".read": true,
//     ".write": true
//   }
// }
const firebaseConfig = {
  apiKey: "AIzaSyDemoKeyPlaceholderForCardGameRealtimeDb",
  authDomain: "plus-minus-card-game.firebaseapp.com",
  databaseURL: "https://plus-minus-card-game-default-rtdb.firebaseio.com",
  projectId: "plus-minus-card-game",
  storageBucket: "plus-minus-card-game.appspot.com",
  messagingSenderId: "9876543210",
  appId: "1:9876543210:web:demotokencardgame"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Helper for generating room codes
export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
