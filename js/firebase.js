// js/firebase.js
// Configuración real de Firebase con Realtime Database habilitado

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBdh8Vcp4le1ElBzYUDDQZIG1f6DzSDh5k",
  authDomain: "loveapp-9d012.firebaseapp.com",
  projectId: "loveapp-9d012",
  storageBucket: "loveapp-9d012.firebasestorage.app",
  messagingSenderId: "538973496059",
  appId: "1:538973496059:web:bc1acbf9ff519b3aa7065e",
  // IMPORTANTE: Realtime Database URL (asegúrate de habilitarla en Firebase Console)
  databaseURL: "https://loveapp-9d012-default-rtdb.firebaseio.com"
};

let rtdb;

try {
  const app = initializeApp(firebaseConfig);
  rtdb = getDatabase(app);
  console.log("[Firebase] Inicializado correctamente ✓");
} catch (error) {
  console.error("[Firebase] Error al inicializar:", error);
}

export { rtdb };
