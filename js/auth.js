import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { auth } from './firebase.js';
import { createUserProfile } from './db.js';

export async function registerUser(nickname, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await createUserProfile(cred.user.uid, { nickname, email });
  return cred.user;
}
export async function loginUser(email, password) { return (await signInWithEmailAndPassword(auth, email, password)).user; }
export async function logoutUser() { return signOut(auth); }
export function authChanged(cb) { return onAuthStateChanged(auth, cb); }
export function getAuthError(code) {
  const map = {
    'auth/invalid-email':'Неверный email.', 'auth/missing-password':'Введите пароль.',
    'auth/weak-password':'Пароль должен быть минимум 6 символов.', 'auth/email-already-in-use':'Email уже занят.',
    'auth/invalid-credential':'Неверный email или пароль.', 'auth/user-not-found':'Пользователь не найден.',
    'auth/wrong-password':'Неверный пароль.'
  };
  return map[code] || code || 'Ошибка авторизации';
}
