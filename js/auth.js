// js/auth.js
import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { createUserProfile, getUserProfile } from "./db.js";
import { showToast } from "./ui.js";

// --- AUTH STATE ---
export let currentUser = null;
export let currentUserData = null;

export function onUserReady(callback) {
  onAuthStateChanged(auth, callback);
}

// --- REGISTER ---
export async function registerUser(nickname, email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfile(cred.user.uid, { nickname, email });
    showToast("Аккаунт создан!", "success");
    return cred.user;
  } catch (e) {
    showToast(getAuthError(e.code), "error");
    throw e;
  }
}

// --- LOGIN ---
export async function loginUser(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    showToast("Добро пожаловать!", "success");
    return cred.user;
  } catch (e) {
    showToast(getAuthError(e.code), "error");
    throw e;
  }
}

// --- LOGOUT ---
export async function logoutUser() {
  await signOut(auth);
  currentUser = null;
  currentUserData = null;
  showToast("Вы вышли из аккаунта", "info");
}

function getAuthError(code) {
  const errors = {
    "auth/email-already-in-use": "Email уже используется",
    "auth/weak-password": "Слишком слабый пароль (мин. 6 символов)",
    "auth/user-not-found": "Пользователь не найден",
    "auth/wrong-password": "Неверный пароль",
    "auth/invalid-email": "Неверный формат email",
    "auth/invalid-credential": "Неверный email или пароль",
  };
  return errors[code] || "Ошибка авторизации";
}
