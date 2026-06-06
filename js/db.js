import { ref, set, get, push, onValue, query, orderByChild, limitToLast, runTransaction, onDisconnect, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import { db } from './firebase.js';

export function userRef(uid){ return ref(db, `users/${uid}`); }
export function inventoryRef(uid){ return ref(db, `users/${uid}/inventory`); }
export async function createUserProfile(uid, { nickname, email }) {
  const snap = await get(userRef(uid));
  if (snap.exists()) return;
  await set(userRef(uid), {
    nickname: nickname || email?.split('@')[0] || 'Player',
    email,
    balance: 1000000,
    role: 'user',
    stats: { wins: 0, losses: 0, upgrades: 0 },
    inventory: {},
    createdAt: Date.now()
  });
}
export async function getUserProfile(uid) { const s = await get(userRef(uid)); return s.exists() ? s.val() : null; }
export function listenUserProfile(uid, cb) { return onValue(userRef(uid), s => cb(s.exists() ? s.val() : null)); }
export function listenLiveDrops(cb) {
  return onValue(query(ref(db, 'liveDrops'), orderByChild('createdAt'), limitToLast(30)), s => {
    const arr = [];
    s.forEach(ch => arr.push({ id: ch.key, ...ch.val() }));
    cb(arr.reverse());
  });
}
export function listenUpgradeCount(cb){ return onValue(ref(db,'meta/upgradeCount'), s => cb(s.val() || 0)); }
export function listenOnlineCount(cb){ return onValue(ref(db,'presence'), s => cb(s.exists() ? s.size : 0)); }
export function setPresence(uid){
  const connectedRef = ref(db, '.info/connected');
  const userPresence = ref(db, `presence/${uid}`);
  return onValue(connectedRef, snap => {
    if (snap.val() === true) {
      onDisconnect(userPresence).remove();
      set(userPresence, { online: true, lastSeen: serverTimestamp() });
    }
  });
}
export async function addInventoryItem(uid, item) {
  const newRef = push(inventoryRef(uid));
  await set(newRef, { ...item, instanceId: newRef.key, boughtAt: Date.now() });
  return newRef.key;
}
export async function removeInventoryItem(uid, instanceId) { await set(ref(db, `users/${uid}/inventory/${instanceId}`), null); }
export async function addBalance(uid, amount) {
  await runTransaction(ref(db, `users/${uid}/balance`), v => Math.max(0, Number(v || 0) + Number(amount || 0)));
}
export async function setBalance(uid, amount) { await set(ref(db, `users/${uid}/balance`), Number(amount || 0)); }
export async function incStats(uid, field) { await runTransaction(ref(db, `users/${uid}/stats/${field}`), v => Number(v || 0) + 1); }
export async function recordUpgrade(data, success) {
  const id = push(ref(db, 'upgrades')).key;
  await set(ref(db, `upgrades/${id}`), { ...data, success, createdAt: Date.now() });
  await runTransaction(ref(db,'meta/upgradeCount'), v => Number(v || 0) + 1);
  if (success) {
    const dropRef = push(ref(db,'liveDrops'));
    await set(dropRef, { uid: data.uid, nickname: data.nickname, chance: data.chance, sourceItem: data.sourceItem, targetItem: data.targetItem, createdAt: Date.now() });
  }
}
export async function adminLog(data){ await set(push(ref(db,'admin_logs')), { ...data, createdAt: Date.now() }); }
