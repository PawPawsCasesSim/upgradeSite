import { $, $$, toast, liveDropMarkup, card, fmt } from './ui.js';
import { registerUser, loginUser, logoutUser, authChanged, getAuthError } from './auth.js';
import { getUserProfile, listenUserProfile, listenLiveDrops, listenUpgradeCount, listenOnlineCount, setPresence } from './db.js';
import { state, renderAll, renderShop, renderTargets, renderChance, buySelected, doUpgrade, inventoryArray, sellInventoryItem, sellAllInventoryItems, desiredChanceFromPreset, autoSelectTargetByChance } from './upgrade.js';
import { initAdmin, fillAdminItems } from './admin.js';
import { loadCatalogFromCsapi } from './items.js';

let unsubProfile = null;

function bindStatic(){
  $('#loginBtn').addEventListener('click', async () => {
    try { await loginUser($('#authEmail').value.trim(), $('#authPassword').value); }
    catch(e){ $('#authError').textContent = getAuthError(e.code); }
  });
  $('#registerBtn').addEventListener('click', async () => {
    try { await registerUser($('#authNick').value.trim(), $('#authEmail').value.trim(), $('#authPassword').value); }
    catch(e){ $('#authError').textContent = getAuthError(e.code); }
  });
  $('#logoutBtn').addEventListener('click', logoutUser);
  $('#topupBtn').addEventListener('click', () => toast('Пополнение сделай через админку или платёжку.'));
  $('#buySelectedBtn').addEventListener('click', buySelected);
  $('#upgradeBtn').addEventListener('click', doUpgrade);
  $('#profileBtn').addEventListener('click', () => openProfile(state.user.uid));
  $$('.modal-close').forEach(b => b.addEventListener('click', () => document.getElementById(b.dataset.close).close()));
  $$('.tab').forEach(btn => btn.addEventListener('click', () => {
    $$('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeList = btn.dataset.list;
    state.selectedShop = null;
    renderShop();
  }));
  ['#shopSearch','#shopMin','#shopMax'].forEach(s => $(s).addEventListener('input', renderShop));
  ['#targetSearch','#targetMin','#targetMax'].forEach(s => $(s).addEventListener('input', renderTargets));
  $('#shopGrid').addEventListener('click', e => {
    const btn = e.target.closest('.skin-card'); if(!btn) return;
    if(btn.dataset.mode === 'shop') state.selectedShop = state.catalog.find(i => i.id === btn.dataset.id);
    if(btn.dataset.mode === 'inventory') {
      state.selectedSource = inventoryArray().find(i => i.instanceId === btn.dataset.id);
      if (state.desiredChance) autoSelectTargetByChance(state.desiredChance);
      else if(state.selectedTarget && state.selectedTarget.price <= state.selectedSource.price) state.selectedTarget = null;
    }
    renderAll();
  });
  $('#targetGrid').addEventListener('click', e => {
    const btn = e.target.closest('.skin-card'); if(!btn) return;
    state.selectedTarget = state.catalog.find(i => i.id === btn.dataset.id);
    renderAll();
  });
  $('.chance-presets').addEventListener('click', e => {
    const btn = e.target.closest('button'); if(!btn) return;
    const wanted = desiredChanceFromPreset(btn.dataset.preset);
    state.desiredChance = wanted;
    btn.dataset.chance = String(wanted);
    if (!state.selectedSource) {
      toast('Сначала выбери свой скин, потом сайт сам подберёт цель под этот шанс.');
      renderChance();
      return;
    }
    const ok = autoSelectTargetByChance(wanted);
    toast(ok ? `Подобрал цель примерно под ${wanted}%` : 'Не нашёл подходящий скин под этот шанс.');
    renderAll();
  });
  $('#liveDrops').addEventListener('click', e => {
    const btn = e.target.closest('.live-card'); if(btn?.dataset.uid) openProfile(btn.dataset.uid);
  });
  $('#profileContent').addEventListener('click', async e => {
    const sellAllBtn = e.target.closest('[data-sell-all]');
    if(sellAllBtn){
      const total = inventoryArray().reduce((sum, item) => sum + Number(item.price || 0), 0);
      if(confirm(`Продать все скины за ◎ ${fmt(total)}?`)){
        await sellAllInventoryItems();
        await openProfile(state.user.uid);
      }
      return;
    }
    const btn = e.target.closest('[data-sell-id]');
    if(!btn) return;
    await sellInventoryItem(btn.dataset.sellId);
    await openProfile(state.user.uid);
  });
}

function profileCard(item, canSell){
  const sellPrice = Math.floor(Number(item.price || 0));
  return `<div class="profile-skin-wrap">
    ${card(item, 'view')}
    ${canSell ? `<button class="sell-btn" data-sell-id="${item.instanceId}">Продать за ◎ ${fmt(sellPrice)}</button>` : ''}
  </div>`;
}

async function openProfile(uid){
  const p = await getUserProfile(uid);
  if(!p) return toast('Профиль не найден.');
  const canSell = uid === state.user?.uid;
  const inv = p.inventory ? Object.entries(p.inventory).map(([id, item]) => ({ ...item, instanceId: item.instanceId || id })) : [];
  const invTotal = Math.floor(inv.reduce((sum, item) => sum + Number(item.price || 0), 0));
  $('#profileContent').innerHTML = `<div class="profile-head"><div class="profile-avatar">${(p.nickname||'U')[0].toUpperCase()}</div><div><h2>${p.nickname || 'Player'}</h2><p class="muted">UID: ${uid}</p></div></div>
    <div class="profile-grid"><div class="profile-stat"><small>Баланс</small><b>◎ ${fmt(p.balance)}</b></div><div class="profile-stat"><small>Побед</small><b>${p.stats?.wins||0}</b></div><div class="profile-stat"><small>Поражений</small><b>${p.stats?.losses||0}</b></div></div>
    <div class="profile-inventory-head"><h3>Инвентарь ${canSell ? '<span class="muted profile-note">продажа за 100% цены</span>' : ''}</h3>${canSell && inv.length ? `<button class="sell-all-btn" data-sell-all="1">Продать всё за ◎ ${fmt(invTotal)}</button>` : ''}</div>
    <div class="profile-inventory skin-grid">${inv.slice(0,64).map(i => profileCard(i, canSell)).join('') || '<p class="muted">Инвентарь пуст</p>'}</div>`;
  $('#profileDialog').showModal();
}

function startListeners(){
  listenLiveDrops(drops => { $('#liveDrops').innerHTML = drops.map(liveDropMarkup).join('') || '<p class="muted" style="font-size:11px;padding:8px">Пока нет успешных апгрейдов</p>'; });
  listenUpgradeCount(n => $('#upgradeCount').textContent = fmt(n));
  listenOnlineCount(n => $('#onlineCount').textContent = fmt(n));
}


async function bootCatalog(){
  state.catalog = await loadCatalogFromCsapi();
  fillAdminItems?.();
  renderAll();
}

bindStatic();
initAdmin();
startListeners();
bootCatalog();

authChanged(user => {
  state.user = user;
  $('#authScreen').classList.toggle('hidden', !!user);
  $('#app').classList.toggle('hidden', !user);
  if(unsubProfile) unsubProfile();
  if(!user) return;
  setPresence(user.uid);
  unsubProfile = listenUserProfile(user.uid, profile => {
    state.profile = profile;
    renderAll();
  });
});
