// js/app.js — главный модуль приложения
import { auth } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { registerUser, loginUser, logoutUser } from "./auth.js";
import { getUserProfile, getUserHistory, listenUserProfile, getUserInventory } from "./db.js";
import { isAdmin } from "./db.js";
import { loadMarketItems, findTargetItems, calculateChance, formatPrice } from "./items.js";
import { drawRoulette, runUpgrade, resetArrow } from "./upgrade.js";
import {
  showToast, showPage, renderItemRow, renderItemCard,
  renderSelectedItem, renderHistoryRow, showResultModal, hideResultModal,
  updateSidebarBalance
} from "./ui.js";
import { initAdmin } from "./admin.js";

// ===== STATE =====
let currentUser = null;
let currentUserData = null;
let selectedSourceItem = null;
let selectedTargetItem = null;
let currentChance = 30;
let marketItems = [];
let userInventory = [];
let unsubscribeProfile = null;

// ===== LOADING =====
async function init() {
  // Анимация загрузки
  await new Promise(r => setTimeout(r, 2200));
  document.getElementById("loading-screen").style.display = "none";

  // Слушаем auth
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await onLogin(user);
    } else {
      currentUser = null;
      showAuthScreen();
    }
  });

  // Auth форма
  setupAuthListeners();
}

async function onLogin(user) {
  document.getElementById("auth-screen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");

  // Слушаем профиль в реальном времени
  if (unsubscribeProfile) unsubscribeProfile();
  unsubscribeProfile = listenUserProfile(user.uid, (data) => {
    currentUserData = data;
    if (data) {
      updateSidebarBalance(data.balance);
      updateProfilePage(data);
      updateStatsPage(data.stats);
    }
  });

  // Показываем/скрываем admin
  if (isAdmin(user.uid)) {
    document.getElementById("admin-nav-item").classList.remove("hidden");
    initAdmin(user.uid);
  }

  // Загружаем данные
  marketItems = await loadMarketItems();
  await refreshInventory();
  await loadHistoryPage();

  // Начальный рендер апгрейда
  renderUpgradePage();

  // Навигация
  setupNavigation();

  // Бургер
  document.getElementById("burger-btn")?.addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("open");
  });

  // Логаут
  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    if (unsubscribeProfile) unsubscribeProfile();
    await logoutUser();
  });

  // Модал апгрейда
  document.getElementById("modal-close-btn")?.addEventListener("click", () => {
    hideResultModal();
    resetArrow(document.getElementById("roulette-arrow"));
    refreshInventory().then(() => renderUpgradePage());
  });

  showPage("upgrade");
}

// ===== AUTH =====
function showAuthScreen() {
  document.getElementById("app").classList.add("hidden");
  document.getElementById("auth-screen").classList.remove("hidden");
}

function setupAuthListeners() {
  // Tab switch
  document.querySelectorAll(".auth-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("login-form").classList.toggle("hidden", tab.dataset.tab !== "login");
      document.getElementById("register-form").classList.toggle("hidden", tab.dataset.tab !== "register");
    });
  });

  document.getElementById("login-btn")?.addEventListener("click", async () => {
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value;
    if (!email || !pass) { showToast("Заполните все поля", "error"); return; }
    await loginUser(email, pass);
  });

  document.getElementById("register-btn")?.addEventListener("click", async () => {
    const nick = document.getElementById("reg-nickname").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const pass = document.getElementById("reg-password").value;
    if (!nick || !email || !pass) { showToast("Заполните все поля", "error"); return; }
    await registerUser(nick, email, pass);
  });
}

// ===== NAVIGATION =====
function setupNavigation() {
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      showPage(page);

      if (page === "inventory") renderInventoryPage();
      if (page === "history") await loadHistoryPage();
      if (page === "stats") updateStatsPage(currentUserData?.stats);
    });
  });
}

// ===== INVENTORY =====
async function refreshInventory() {
  if (!currentUser) return;
  userInventory = await getUserInventory(currentUser.uid);
}

function renderInventoryPage() {
  const grid = document.getElementById("inventory-grid");
  const search = document.getElementById("inv-search")?.value?.toLowerCase() || "";
  const sort = document.getElementById("inv-sort")?.value || "price-desc";
  const rarity = document.getElementById("inv-rarity")?.value || "";

  let items = [...userInventory];

  if (search) items = items.filter(i => i.name?.toLowerCase().includes(search));
  if (rarity) items = items.filter(i => i.rarity === rarity);

  if (sort === "price-desc") items.sort((a, b) => b.price - a.price);
  else if (sort === "price-asc") items.sort((a, b) => a.price - b.price);
  else if (sort === "name-asc") items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

  const total = items.reduce((sum, i) => sum + (i.price || 0), 0);
  document.getElementById("inv-count").textContent = items.length;
  document.getElementById("inv-total-value").textContent = formatPrice(total);

  grid.innerHTML = "";
  if (!items.length) {
    grid.innerHTML = '<div class="empty-state">Инвентарь пуст</div>';
    return;
  }
  items.forEach(item => grid.appendChild(renderItemCard(item)));

  // Filters
  ["inv-search", "inv-sort", "inv-rarity"].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el._hasListener) {
      el.addEventListener("input", renderInventoryPage);
      el.addEventListener("change", renderInventoryPage);
      el._hasListener = true;
    }
  });
}

// ===== UPGRADE PAGE =====
function renderUpgradePage() {
  renderSourceItems();
  renderTargetItems();
  drawRoulette(document.getElementById("roulette-canvas"), currentChance);
  document.getElementById("current-chance-val").textContent =
    currentChance === 50 ? "×2" : `${currentChance}%`;
  updateUpgradeBtn();

  // Chance buttons
  document.querySelectorAll(".chance-btn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.chance) === currentChance);
    if (!btn._hasListener) {
      btn.addEventListener("click", () => {
        currentChance = parseInt(btn.dataset.chance);
        selectedTargetItem = null;
        renderUpgradePage();
      });
      btn._hasListener = true;
    }
  });

  // Upgrade button
  const upgradeBtn = document.getElementById("upgrade-btn");
  if (!upgradeBtn._hasListener) {
    upgradeBtn.addEventListener("click", async () => {
      if (!selectedSourceItem || !selectedTargetItem || !currentUser) return;
      await runUpgrade(
        currentUser.uid,
        selectedSourceItem,
        selectedTargetItem,
        currentChance === 50 ? 50 : currentChance,
        (won, item) => {
          showResultModal(won, item);
          if (won) {
            showToast(`🏆 Вы выиграли ${item.name}!`, "success");
          } else {
            showToast("💀 Поражение. Попробуйте ещё раз!", "error");
          }
        }
      );
    });
    upgradeBtn._hasListener = true;
  }
}

function renderSourceItems() {
  const list = document.getElementById("source-items-list");
  const search = document.getElementById("source-search")?.value?.toLowerCase() || "";

  let items = [...userInventory];
  if (search) items = items.filter(i => i.name?.toLowerCase().includes(search));

  list.innerHTML = "";
  if (!items.length) {
    list.innerHTML = '<div class="empty-state">Инвентарь пуст</div>';
  } else {
    items.forEach(item => {
      const row = renderItemRow(item, (selected, el) => {
        selectedSourceItem = selected;
        selectedTargetItem = null;
        list.querySelectorAll(".item-row").forEach(r => r.classList.remove("selected"));
        el.classList.add("selected");
        renderSelectedItem(document.getElementById("source-selected"), selected);
        autoSelectTarget();
        updateUpgradeBtn();
      }, selectedSourceItem?.key === item.key);
      list.appendChild(row);
    });
  }

  renderSelectedItem(document.getElementById("source-selected"), selectedSourceItem);

  // Source search
  const searchEl = document.getElementById("source-search");
  if (searchEl && !searchEl._hasListener) {
    searchEl.addEventListener("input", () => renderSourceItems());
    searchEl._hasListener = true;
  }
}

function renderTargetItems() {
  const list = document.getElementById("target-items-list");
  const search = document.getElementById("target-search")?.value?.toLowerCase() || "";

  if (!selectedSourceItem) {
    list.innerHTML = '<div class="empty-state">Выберите исходный предмет</div>';
    renderSelectedItem(document.getElementById("target-selected"), null);
    return;
  }

  let chance = currentChance === 50 ? 50 : currentChance;
  let targets = findTargetItems(selectedSourceItem.price, chance, marketItems);

  if (search) targets = targets.filter(i => i.name?.toLowerCase().includes(search));

  list.innerHTML = "";
  if (!targets.length) {
    list.innerHTML = '<div class="empty-state">Нет подходящих предметов в этом ценовом диапазоне</div>';
    // Show all market items for manual pick
    marketItems.forEach(item => {
      const row = renderItemRow(item, (selected, el) => {
        selectedTargetItem = selected;
        const srcPrice = selectedSourceItem.price;
        currentChance = Math.round(calculateChance(srcPrice, selected.price));
        list.querySelectorAll(".item-row").forEach(r => r.classList.remove("selected"));
        el.classList.add("selected");
        renderSelectedItem(document.getElementById("target-selected"), selected, "ЦЕЛЬ");
        drawRoulette(document.getElementById("roulette-canvas"), currentChance);
        document.getElementById("current-chance-val").textContent = `${currentChance}%`;
        updateUpgradeBtn();
      }, selectedTargetItem?.id === item.id);
      list.appendChild(row);
    });
  } else {
    targets.forEach(item => {
      const row = renderItemRow(item, (selected, el) => {
        selectedTargetItem = selected;
        list.querySelectorAll(".item-row").forEach(r => r.classList.remove("selected"));
        el.classList.add("selected");
        renderSelectedItem(document.getElementById("target-selected"), selected, "ЦЕЛЬ");
        updateUpgradeBtn();
      }, selectedTargetItem?.id === item.id);
      list.appendChild(row);
    });
  }

  renderSelectedItem(document.getElementById("target-selected"), selectedTargetItem, selectedTargetItem ? "ЦЕЛЬ" : "");

  // Target search
  const searchEl = document.getElementById("target-search");
  if (searchEl && !searchEl._hasListener) {
    searchEl.addEventListener("input", () => renderTargetItems());
    searchEl._hasListener = true;
  }
}

function autoSelectTarget() {
  if (!selectedSourceItem) return;
  const chance = currentChance === 50 ? 50 : currentChance;
  const targets = findTargetItems(selectedSourceItem.price, chance, marketItems);
  if (targets.length) {
    selectedTargetItem = targets[0];
    renderTargetItems();
  } else {
    selectedTargetItem = null;
    renderTargetItems();
  }
}

function updateUpgradeBtn() {
  const btn = document.getElementById("upgrade-btn");
  if (btn) btn.disabled = !selectedSourceItem || !selectedTargetItem;
}

// ===== HISTORY PAGE =====
async function loadHistoryPage() {
  if (!currentUser) return;
  const list = document.getElementById("history-list");
  list.innerHTML = '<div class="loading-items">Загрузка...</div>';

  const history = await getUserHistory(currentUser.uid);
  list.innerHTML = "";
  if (!history.length) {
    list.innerHTML = '<div class="empty-state">История пуста</div>';
    return;
  }
  history.forEach(h => list.appendChild(renderHistoryRow(h)));
}

// ===== PROFILE PAGE =====
function updateProfilePage(data) {
  if (!data) return;
  const nick = data.nickname || "—";
  document.getElementById("profile-nick").textContent = nick;
  document.getElementById("profile-email").textContent = data.email || "—";
  document.getElementById("profile-avatar").textContent = nick[0]?.toUpperCase() || "?";
  document.getElementById("p-wins").textContent = data.stats?.wins || 0;
  document.getElementById("p-losses").textContent = data.stats?.losses || 0;
  document.getElementById("p-balance").textContent = formatPrice(data.balance || 0);
  const total = (data.stats?.wins || 0) + (data.stats?.losses || 0);
  const wr = total > 0 ? Math.round(((data.stats?.wins || 0) / total) * 100) : 0;
  document.getElementById("p-winrate").textContent = `${wr}%`;
}

// ===== STATS PAGE =====
async function updateStatsPage(stats) {
  if (!stats) return;
  const wins = stats.wins || 0;
  const losses = stats.losses || 0;
  const total = wins + losses;
  const wr = total > 0 ? Math.round((wins / total) * 100) : 0;

  document.getElementById("st-total").textContent = total;
  document.getElementById("st-wins").textContent = wins;
  document.getElementById("st-losses").textContent = losses;
  document.getElementById("st-winrate").textContent = `${wr}%`;

  // Лучший/худший
  if (currentUser) {
    const history = await getUserHistory(currentUser.uid);
    const winHistory = history.filter(h => h.result === "win");
    const loseHistory = history.filter(h => h.result === "lose");

    if (winHistory.length) {
      const best = winHistory.reduce((a, b) => (a.targetItem?.price || 0) > (b.targetItem?.price || 0) ? a : b);
      document.getElementById("st-best-win").textContent = `${best.targetItem?.name} — ${formatPrice(best.targetItem?.price)}`;
    }
    if (loseHistory.length) {
      const worst = loseHistory.reduce((a, b) => (a.sourceItem?.price || 0) > (b.sourceItem?.price || 0) ? a : b);
      document.getElementById("st-worst-loss").textContent = `${worst.sourceItem?.name} — ${formatPrice(worst.sourceItem?.price)}`;
    }
  }
}

// ===== START =====
init();
