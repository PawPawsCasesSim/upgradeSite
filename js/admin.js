// js/admin.js
import {
  getAllUsers, adminAddBalance, adminRemoveBalance,
  getAdminLogs, adminAddItemToUser, adminRemoveItemFromUser, getUserInventory
} from "./db.js";
import { showToast } from "./ui.js";
import { formatPrice } from "./items.js";

let selectedTargetUser = null;
let balanceModal = null;

export function initAdmin(currentUid) {
  balanceModal = document.getElementById("balance-modal");

  // Admin tabs
  document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".admin-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`atab-${tab.dataset.atab}`).classList.add("active");
    });
  });

  // Load users
  document.getElementById("admin-load-users")?.addEventListener("click", () => loadUsers(currentUid));

  // Load logs
  document.getElementById("load-logs-btn")?.addEventListener("click", () => loadLogs());

  // Balance modal actions
  document.getElementById("balance-add-btn")?.addEventListener("click", async () => {
    if (!selectedTargetUser) return;
    const amount = parseFloat(document.getElementById("balance-amount").value);
    if (isNaN(amount) || amount <= 0) { showToast("Введите корректную сумму", "error"); return; }
    await adminAddBalance(selectedTargetUser, amount, currentUid);
    showToast(`+$${amount.toFixed(2)} выдано`, "success");
    closeBalanceModal();
    loadUsers(currentUid);
  });

  document.getElementById("balance-remove-btn")?.addEventListener("click", async () => {
    if (!selectedTargetUser) return;
    const amount = parseFloat(document.getElementById("balance-amount").value);
    if (isNaN(amount) || amount <= 0) { showToast("Введите корректную сумму", "error"); return; }
    await adminRemoveBalance(selectedTargetUser, amount, currentUid);
    showToast(`-$${amount.toFixed(2)} списано`, "success");
    closeBalanceModal();
    loadUsers(currentUid);
  });

  document.getElementById("balance-cancel-btn")?.addEventListener("click", closeBalanceModal);
  document.querySelector("#balance-modal .modal-overlay")?.addEventListener("click", closeBalanceModal);
}

async function loadUsers(adminUid) {
  const list = document.getElementById("admin-users-list");
  list.innerHTML = '<div class="loading-items">Загрузка...</div>';

  try {
    const users = await getAllUsers();
    const search = document.getElementById("admin-user-search")?.value?.toLowerCase() || "";
    const filtered = search ? users.filter(u =>
      (u.nickname || "").toLowerCase().includes(search) ||
      (u.email || "").toLowerCase().includes(search)
    ) : users;

    list.innerHTML = "";
    if (!filtered.length) {
      list.innerHTML = '<div class="empty-state">Пользователи не найдены</div>';
      return;
    }

    filtered.forEach(user => {
      const wins = user.stats?.wins || 0;
      const losses = user.stats?.losses || 0;
      const total = wins + losses;
      const wr = total > 0 ? Math.round((wins / total) * 100) : 0;

      const row = document.createElement("div");
      row.className = "admin-user-row";
      row.innerHTML = `
        <div class="admin-user-info">
          <div class="admin-user-nick">${user.nickname || "—"}</div>
          <div class="admin-user-email">${user.email || user.uid}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px">
            W:${wins} L:${losses} WR:${wr}%
          </div>
        </div>
        <div class="admin-user-balance">${formatPrice(user.balance || 0)}</div>
        <div class="admin-user-actions">
          <button class="btn-secondary btn-bal" data-uid="${user.uid}" data-nick="${user.nickname}">💰 Баланс</button>
          <button class="btn-secondary btn-inv" data-uid="${user.uid}" data-nick="${user.nickname}">🎒 Инвентарь</button>
        </div>
      `;

      row.querySelector(".btn-bal").addEventListener("click", (e) => {
        const uid = e.target.dataset.uid;
        const nick = e.target.dataset.nick;
        openBalanceModal(uid, nick);
      });

      row.querySelector(".btn-inv").addEventListener("click", async (e) => {
        const uid = e.target.dataset.uid;
        await showUserInventory(uid, adminUid);
      });

      list.appendChild(row);
    });
  } catch (e) {
    list.innerHTML = `<div class="empty-state">Ошибка: ${e.message}</div>`;
  }

  // Search
  document.getElementById("admin-user-search")?.addEventListener("input", () => loadUsers(adminUid));
}

async function showUserInventory(targetUid, adminUid) {
  const items = await getUserInventory(targetUid);
  if (!items.length) { showToast("Инвентарь пуст", "info"); return; }

  // Simple inline display
  const info = items.map(i => `• ${i.name} — $${Number(i.price).toFixed(2)}`).join("\n");
  const action = prompt(`Инвентарь (${items.length} предметов):\n${info}\n\nВведите ключ предмета для удаления (или оставьте пустым):`);
  if (action) {
    const item = items.find(i => i.key === action);
    if (!item) { showToast("Предмет не найден", "error"); return; }
    if (confirm(`Удалить "${item.name}"?`)) {
      await adminRemoveItemFromUser(adminUid, targetUid, action);
      showToast("Предмет удалён", "success");
    }
  }
}

async function loadLogs() {
  const container = document.getElementById("admin-logs-list");
  container.innerHTML = '<div class="loading-items">Загрузка логов...</div>';

  try {
    const logs = await getAdminLogs();
    container.innerHTML = "";

    if (!logs.length) {
      container.innerHTML = '<div class="empty-state">Логи пусты</div>';
      return;
    }

    logs.slice(0, 100).forEach(log => {
      const row = document.createElement("div");
      row.className = "log-row";
      const date = new Date(log.timestamp);
      const typeMap = { win: "ПОБЕДА", lose: "ПОРАЖЕНИЕ", balance_add: "БАЛАНС+", balance_remove: "БАЛАНС-", item_add: "ПРЕДМЕТ+", item_remove: "ПРЕДМЕТ-" };
      const classMap = { win: "log-win", lose: "log-lose", balance_add: "log-balance", balance_remove: "log-balance" };
      row.innerHTML = `
        <span class="log-date">${date.toLocaleDateString("ru")} ${date.toLocaleTimeString("ru", {hour:'2-digit',minute:'2-digit'})}</span>
        <span class="log-type ${classMap[log.type] || 'log-balance'}">${typeMap[log.type] || log.type}</span>
        <span>${log.sourceItem ? `${log.sourceItem} → ${log.targetItem}` : (log.data || "")}</span>
        ${log.chance ? `<span style="color:var(--text-muted)">${log.chance}%</span>` : ""}
      `;
      container.appendChild(row);
    });
  } catch (e) {
    container.innerHTML = `<div class="empty-state">Ошибка: ${e.message}</div>`;
  }
}

function openBalanceModal(uid, nickname) {
  selectedTargetUser = uid;
  document.getElementById("balance-modal-title").textContent = `БАЛАНС: ${nickname || uid}`;
  document.getElementById("balance-amount").value = "";
  balanceModal.classList.remove("hidden");
}

function closeBalanceModal() {
  balanceModal.classList.add("hidden");
  selectedTargetUser = null;
}
