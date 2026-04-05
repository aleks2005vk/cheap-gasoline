// Автоматическое определение адреса бэкенда
export const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:8001"
    : window.location.hostname === "192.168.1.31"
    ? "http://192.168.1.31:8001"
    : "https://cheap-gasoline.onrender.com");

// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyD1hP4WrnM25LvuNDfOf6a8FBTAYzWOkQU",
  authDomain: "cheap-gasoline-8b97c.firebaseapp.com",
  projectId: "cheap-gasoline-8b97c",
  storageBucket: "cheap-gasoline-8b97c.firebasestorage.app",
  messagingSenderId: "336052007120",
  appId: "1:336052007120:web:a1fe5515cde2946cc3aed5",
};
