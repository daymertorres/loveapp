// js/firebase.js
// IMPORTANTE: Reemplaza esta configuración con la de tu proyecto de Firebase.
// 1. Ve a la Consola de Firebase (https://console.firebase.google.com/)
// 2. Crea un proyecto y añade una aplicación web
// 3. Copia el objeto firebaseConfig y pégalo aquí.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSy_YOUR_API_KEY_HERE",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef123456",
    databaseURL: "https://your-project-id.firebaseio.com"
};

// Inicializar Firebase (Comentado para evitar errores si no hay configuración real aún)
let app, db, rtdb;

try {
    // Habilitando inicialización real. ¡OJO! Sin configuración válida fallará.
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    rtdb = getDatabase(app);
    console.log("Firebase inicializado. Esperando que configures apiKey válida.");

    console.log("Esperando configuración real de Firebase...");
} catch (error) {
    console.error("Error al inicializar Firebase:", error);
}

export { db, rtdb };
