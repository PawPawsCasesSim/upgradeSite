// js/db.js
import { db, ADMIN_UIDS } from "./firebase-config.js";
import {
  ref, set, get, update, push, remove, onValue, query, orderByChild
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ===== USER PROFILE =====

export async function createUserProfile(uid, { nickname, email }) {
  await set(ref(db, `users/${uid}`), {
    nickname,
    email,
    balance: 0,
    stats: { wins: 0, losses: 0 },
    inventory: {},
    createdAt: Date.now()
  });
}

export async function getUserProfile(uid) {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? snap.val() : null;
}

export function listenUserProfile(uid, callback) {
  return onValue(ref(db, `users/${uid}`), (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
}

// ===== BALANCE (ADMIN ONLY) =====

export async function adminAddBalance(targetUid, amount, adminUid) {
  const snap = await get(ref(db, `users/${targetUid}/balance`));
  const current = snap.val() || 0;
  await update(ref(db, `users/${targetUid}`), { balance: current + amount });
  await logAdminAction(adminUid, targetUid, "balance_add", amount);
}

export async function adminRemoveBalance(targetUid, amount, adminUid) {
  const snap = await get(ref(db, `users/${targetUid}/balance`));
  const current = snap.val() || 0;
  const newBal = Math.max(0, current - amount);
  await update(ref(db, `users/${targetUid}`), { balance: newBal });
  await logAdminAction(adminUid, targetUid, "balance_remove", amount);
}

// ===== INVENTORY =====

export async function addItemToInventory(uid, item) {
  const newRef = push(ref(db, `users/${uid}/inventory`));
  await set(newRef, { ...item, addedAt: Date.now() });
  return newRef.key;
}

export async function removeItemFromInventory(uid, itemKey) {
  await remove(ref(db, `users/${uid}/inventory/${itemKey}`));
}

export async function getUserInventory(uid) {
  const snap = await get(ref(db, `users/${uid}/inventory`));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([key, val]) => ({ key, ...val }));
}

// ===== UPGRADE LOGIC (Server-side simulation via trusted client) =====
// В продакшене это должно быть Firebase Function!

export async function processUpgrade(uid, sourceItem, targetItem, chancePercent) {
  // Получаем актуальный баланс (не нужен при бартере предметами)
  const userSnap = await get(ref(db, `users/${uid}`));
  const userData = userSnap.val();
  if (!userData) throw new Error("Пользователь не найден");

  // Проверяем, что предмет есть в инвентаре
  const invSnap = await get(ref(db, `users/${uid}/inventory/${sourceItem.key}`));
  if (!invSnap.exists()) throw new Error("Предмет не найден в инвентаре");

  // Генерируем результат (в продакшене — только Firebase Function!)
  const roll = Math.random() * 100;
  const won = roll < chancePercent;

  // Начинаем транзакцию изменений
  const updates = {};

  // Удаляем исходный предмет
  updates[`users/${uid}/inventory/${sourceItem.key}`] = null;

  // Обновляем статистику
  if (won) {
    updates[`users/${uid}/stats/wins`] = (userData.stats?.wins || 0) + 1;
    // Добавляем целевой предмет
    const newItemKey = push(ref(db, `users/${uid}/inventory`)).key;
    updates[`users/${uid}/inventory/${newItemKey}`] = {
      ...targetItem,
      addedAt: Date.now()
    };
  } else {
    updates[`users/${uid}/stats/losses`] = (userData.stats?.losses || 0) + 1;
  }

  // Записываем апгрейд в историю
  const upgradeKey = push(ref(db, "upgrades")).key;
  updates[`upgrades/${upgradeKey}`] = {
    uid,
    sourceItem: { name: sourceItem.name, price: sourceItem.price, image: sourceItem.image || "" },
    targetItem: { name: targetItem.name, price: targetItem.price, image: targetItem.image || "" },
    chance: chancePercent,
    result: won ? "win" : "lose",
    roll: Math.round(roll * 100) / 100,
    timestamp: Date.now()
  };

  // Лог
  const logKey = push(ref(db, "admin_logs")).key;
  updates[`admin_logs/${logKey}`] = {
    type: won ? "win" : "lose",
    uid,
    sourceItem: sourceItem.name,
    targetItem: targetItem.name,
    chance: chancePercent,
    timestamp: Date.now()
  };

  await update(ref(db), updates);
  return { won, roll: Math.round(roll * 100) / 100 };
}

// ===== HISTORY =====

export async function getUserHistory(uid) {
  const snap = await get(query(ref(db, "upgrades"), orderByChild("uid")));
  if (!snap.exists()) return [];
  const all = [];
  snap.forEach(child => {
    const val = child.val();
    if (val.uid === uid) all.push({ key: child.key, ...val });
  });
  return all.sort((a, b) => b.timestamp - a.timestamp);
}

// ===== ADMIN =====

export async function getAllUsers() {
  const snap = await get(ref(db, "users"));
  if (!snap.exists()) return [];
  return Object.entries(snap.val()).map(([uid, data]) => ({ uid, ...data }));
}

export async function adminAddItemToUser(adminUid, targetUid, item) {
  await addItemToInventory(targetUid, item);
  await logAdminAction(adminUid, targetUid, "item_add", item.name);
}

export async function adminRemoveItemFromUser(adminUid, targetUid, itemKey) {
  await removeItemFromInventory(targetUid, itemKey);
  await logAdminAction(adminUid, targetUid, "item_remove", itemKey);
}

export async function getAdminLogs() {
  const snap = await get(ref(db, "admin_logs"));
  if (!snap.exists()) return [];
  const logs = [];
  snap.forEach(child => logs.push({ key: child.key, ...child.val() }));
  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

async function logAdminAction(adminUid, targetUid, type, data) {
  await push(ref(db, "admin_logs"), {
    type,
    adminUid,
    targetUid,
    data,
    timestamp: Date.now()
  });
}

export function isAdmin(uid) {
  return ADMIN_UIDS.includes(uid);
}
