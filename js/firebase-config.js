// js/firebase-config.js
// ⚠️ ЗАМЕНИТЕ НА СВОИ ДАННЫЕ ИЗ FIREBASE CONSOLE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA43oRwIsxvuli5Rvzdu24HkGS5T6Py1gU",
  authDomain: "upgrade-b63cc.firebaseapp.com",
  databaseURL: "https://upgrade-b63cc-default-rtdb.firebaseio.com",
  projectId: "upgrade-b63cc",
  storageBucket: "upgrade-b63cc.firebasestorage.app",
  messagingSenderId: "128834836161",
  appId: "1:128834836161:web:acad25af194c073b842640"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// UID администраторов — добавьте сюда UID после регистрации
export const ADMIN_UIDS = [
  "ADMIN_UID_1",  // Замените на реальный UID
];
