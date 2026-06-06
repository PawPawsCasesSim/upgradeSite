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
    balance: 500,
    role: 'user',
    stats: { wins: 0, losses: 0, upgrades: 0 },
    inventory: {},
    createdAt: Date.now()
  });
}
export async function getUserProfile(uid) { const s = await get(userRef(uid)); return s.exists() ? s.val() : null; }
export function listenUserProfile(uid, cb) { return onValue(userRef(uid), s => cb(s.exists() ? s.val() : null)); }
function normalizeLiveDrop(id, value){
  if(!value) return null;
  const targetItem = value.targetItem || value.target || {};
  if(!targetItem || !Object.keys(targetItem).length) return null;
  return {
    id,
    uid: value.uid,
    nickname: value.nickname || 'Player',
    chance: Number(value.chance || 0),
    sourceItem: value.sourceItem || {},
    targetItem,
    createdAt: Number(value.createdAt || Date.now())
  };
}

export function listenLiveDrops(cb) {
  let live = [];
  let successfulUpgrades = [];
  const emit = () => {
    const map = new Map();
    [...live, ...successfulUpgrades].forEach(d => {
      if(!d) return;
      const key = d.id || `${d.uid || 'u'}-${d.createdAt}-${d.targetItem?.id || d.targetItem?.name || 'skin'}`;
      map.set(key, d);
    });
    const arr = [...map.values()].sort((a,b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).slice(0,30);
    cb(arr);
  };

  const unsubLive = onValue(query(ref(db, 'liveDrops'), orderByChild('createdAt'), limitToLast(30)), s => {
    const arr = [];
    s.forEach(ch => { const d = normalizeLiveDrop(ch.key, ch.val()); if(d) arr.push(d); });
    live = arr;
    emit();
  });

  // Запасной источник: если liveDrops не был создан из-за старых правил/старой версии,
  // лента всё равно берёт последние успешные апгрейды из /upgrades.
  const unsubUpgrades = onValue(query(ref(db, 'upgrades'), orderByChild('createdAt'), limitToLast(80)), s => {
    const arr = [];
    s.forEach(ch => {
      const v = ch.val();
      if(v?.success === true){
        const d = normalizeLiveDrop(ch.key, v);
        if(d) arr.push(d);
      }
    });
    successfulUpgrades = arr;
    emit();
  });

  return () => { unsubLive(); unsubUpgrades(); };
}

export async function findUserByNickname(nickname){
  const wanted = String(nickname || '').trim().toLowerCase();
  if(!wanted) return null;
  const s = await get(ref(db, 'users'));
  const matches = [];
  s.forEach(ch => {
    const user = ch.val() || {};
    if(String(user.nickname || '').trim().toLowerCase() === wanted){
      matches.push({ uid: ch.key, ...user });
    }
  });
  if(matches.length === 1) return matches[0];
  if(matches.length > 1) return { duplicate: true, matches };
  return null;
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
