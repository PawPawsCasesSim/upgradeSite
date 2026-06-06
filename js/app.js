import { $, $$, toast, liveDropMarkup, card, fmt } from './ui.js';
import { registerUser, loginUser, logoutUser, authChanged, getAuthError } from './auth.js';
import { getUserProfile, listenUserProfile, listenLiveDrops, listenUpgradeCount } from './db.js';
import { state, renderAll, renderShop, renderTargets, renderChance, buySelected, doUpgrade, inventoryArray } from './upgrade.js';
import { initAdmin } from './admin.js';

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
      if(state.selectedTarget && state.selectedTarget.price <= state.selectedSource.price) state.selectedTarget = null;
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
    state.preset = btn.dataset.preset;
    renderChance();
  });
  $('#liveDrops').addEventListener('click', e => {
    const btn = e.target.closest('.live-card'); if(btn?.dataset.uid) openProfile(btn.dataset.uid);
  });
}

async function openProfile(uid){
  const p = await getUserProfile(uid);
  if(!p) return toast('Профиль не найден.');
  const inv = p.inventory ? Object.values(p.inventory) : [];
  $('#profileContent').innerHTML = `<div class="profile-head"><div class="profile-avatar">${(p.nickname||'U')[0].toUpperCase()}</div><div><h2>${p.nickname || 'Player'}</h2><p class="muted">UID: ${uid}</p></div></div>
    <div class="profile-grid"><div class="profile-stat"><small>Баланс</small><b>◎ ${fmt(p.balance)}</b></div><div class="profile-stat"><small>Побед</small><b>${p.stats?.wins||0}</b></div><div class="profile-stat"><small>Поражений</small><b>${p.stats?.losses||0}</b></div></div>
    <h3>Инвентарь</h3><div class="skin-grid">${inv.slice(0,16).map(i => card(i,'view')).join('') || '<p class="muted">Инвентарь пуст</p>'}</div>`;
  $('#profileDialog').showModal();
}

function startListeners(){
  listenLiveDrops(drops => { $('#liveDrops').innerHTML = drops.map(liveDropMarkup).join('') || '<p class="muted" style="font-size:11px;padding:8px">Пока нет успешных апгрейдов</p>'; });
  listenUpgradeCount(n => $('#upgradeCount').textContent = fmt(n));
}

bindStatic();
initAdmin();
startListeners();

authChanged(user => {
  state.user = user;
  $('#authScreen').classList.toggle('hidden', !!user);
  $('#app').classList.toggle('hidden', !user);
  if(unsubProfile) unsubProfile();
  if(!user) return;
  unsubProfile = listenUserProfile(user.uid, profile => {
    state.profile = profile;
    renderAll();
  });
});
