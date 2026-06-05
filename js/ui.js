// js/ui.js
import { getRarityColor, formatPrice } from "./items.js";

// ===== TOAST NOTIFICATIONS =====
export function showToast(msg, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== PAGE NAVIGATION =====
export function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));

  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.add("active");

  const link = document.querySelector(`[data-page="${pageId}"]`);
  if (link) link.classList.add("active");

  // Закрыть sidebar на мобильном
  document.getElementById("sidebar").classList.remove("open");
}

// ===== RENDER ITEM ROW (для списков апгрейда) =====
export function renderItemRow(item, onClick, isSelected = false) {
  const div = document.createElement("div");
  div.className = `item-row${isSelected ? " selected" : ""}`;
  div.innerHTML = `
    <div class="item-rarity-dot" style="background:${getRarityColor(item.rarity)}"></div>
    <img src="${item.image || ''}" alt="${item.name}" loading="lazy" onerror="this.style.display='none'" />
    <div class="item-row-info">
      <div class="item-row-name">${item.name}</div>
      <div class="item-row-price">${formatPrice(item.price)}</div>
    </div>
  `;
  div.addEventListener("click", () => onClick(item, div));
  return div;
}

// ===== RENDER ITEM CARD (инвентарь) =====
export function renderItemCard(item, onClick) {
  const div = document.createElement("div");
  div.className = "item-card";
  const rarityClass = (item.rarity || "").split(" ")[0];
  div.innerHTML = `
    <div class="item-rarity-bar rarity-${rarityClass}" style="background-color:${getRarityColor(item.rarity)}"></div>
    <div class="item-card-img">
      <img src="${item.image || ''}" alt="${item.name}" loading="lazy" onerror="this.style.display='none'" />
    </div>
    <div class="item-card-body">
      <div class="item-card-name">${item.name}</div>
      <div class="item-card-price">${formatPrice(item.price)}</div>
      <div style="font-size:0.7rem;color:${getRarityColor(item.rarity)};margin-top:4px;letter-spacing:1px">${item.rarity || ''}</div>
    </div>
  `;
  if (onClick) div.addEventListener("click", () => onClick(item));
  return div;
}

// ===== RENDER SELECTED ITEM DISPLAY =====
export function renderSelectedItem(container, item, label = "") {
  if (!item) {
    container.innerHTML = `<div class="no-item">Предмет не выбран</div>`;
    return;
  }
  container.innerHTML = `
    <div class="selected-item-card">
      <img src="${item.image || ''}" alt="${item.name}" onerror="this.style.display='none'" />
      <div>
        ${label ? `<div style="font-size:0.65rem;color:#4a6070;letter-spacing:2px;margin-bottom:2px">${label}</div>` : ""}
        <div class="item-name">${item.name}</div>
        <div class="item-price" style="color:${getRarityColor(item.rarity)}">${item.rarity || ''}</div>
        <div class="item-price">$${Number(item.price).toFixed(2)}</div>
      </div>
    </div>
  `;
}

// ===== RENDER HISTORY ROW =====
export function renderHistoryRow(upgrade) {
  const div = document.createElement("div");
  div.className = `history-item ${upgrade.result}`;
  const date = new Date(upgrade.timestamp);
  div.innerHTML = `
    <div class="history-date">${date.toLocaleDateString("ru")} ${date.toLocaleTimeString("ru", {hour:'2-digit',minute:'2-digit'})}</div>
    <div class="history-items">
      <span>${upgrade.sourceItem?.name || "?"}</span>
      <span class="history-arrow">→</span>
      <span style="color:${upgrade.result === 'win' ? 'var(--green)' : 'var(--red)'}">${upgrade.targetItem?.name || "?"}</span>
    </div>
    <div class="history-chance">${upgrade.chance}%</div>
    <div class="history-result ${upgrade.result === 'win' ? 'result-win' : 'result-lose'}">
      ${upgrade.result === 'win' ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}
    </div>
  `;
  return div;
}

// ===== RESULT MODAL =====
export function showResultModal(won, targetItem) {
  const modal = document.getElementById("result-modal");
  const icon = document.getElementById("modal-result-icon");
  const title = document.getElementById("modal-result-title");
  const itemEl = document.getElementById("modal-result-item");

  if (won) {
    icon.textContent = "🏆";
    title.textContent = "ПОБЕДА!";
    title.style.color = "var(--green)";
    itemEl.innerHTML = `Вы получили: <strong style="color:var(--green)">${targetItem.name}</strong><br><span style="color:var(--accent)">$${Number(targetItem.price).toFixed(2)}</span>`;
  } else {
    icon.textContent = "💀";
    title.textContent = "ПОРАЖЕНИЕ";
    title.style.color = "var(--red)";
    itemEl.innerHTML = `Вы потеряли предмет.<br>Попробуйте ещё раз!`;
  }

  modal.classList.remove("hidden");
}

export function hideResultModal() {
  document.getElementById("result-modal").classList.add("hidden");
}

// ===== UPDATE SIDEBAR BALANCE =====
export function updateSidebarBalance(balance) {
  const el = document.getElementById("sidebar-balance");
  if (el) el.textContent = `$${Number(balance || 0).toFixed(2)}`;
}
