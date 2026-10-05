import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDV8xoDmEgF9HmkdquExrLsQeNFVoqwdhw",
    authDomain: "spoticlone-d5fa2.firebaseapp.com",
    databaseURL: "https://spoticlone-d5fa2-default-rtdb.firebaseio.com",
    projectId: "spoticlone-d5fa2",
    storageBucket: "spoticlone-d5fa2.firebasestorage.app",
    messagingSenderId: "450718172255",
    appId: "1:450718172255:web:684e05cc53914070d647ea",
    measurementId: "G-13ZWF3QE86"
  };

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);