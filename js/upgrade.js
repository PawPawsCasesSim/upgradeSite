import { FALLBACK_SKINS } from './items.js';
import { $, card, selectedMarkup, itemTitle, fmt, toast } from './ui.js';
import { addInventoryItem, removeInventoryItem, addBalance, incStats, recordUpgrade } from './db.js';

export const state = {
  user: null,
  profile: null,
  catalog: FALLBACK_SKINS,
  activeList: 'shop',
  selectedShop: null,
  selectedSource: null,
  selectedTarget: null,
  preset: null,
  spinning: false,
  arrowRotation: 0
};

export function inventoryArray(){
  const inv = state.profile?.inventory || {};
  if (Array.isArray(inv)) return inv.map((x,i)=>({ ...x, instanceId: x.instanceId || String(i) }));
  return Object.entries(inv).map(([k,v]) => ({ ...v, instanceId: k }));
}

export function chance(){
  if(!state.selectedSource || !state.selectedTarget) return 0;
  let c = (Number(state.selectedSource.price) / Number(state.selectedTarget.price)) * 100;
  if (state.preset) c = Math.min(Number(state.preset), c);
  return Math.max(0.01, Math.min(75, c));
}

function filterList(list, searchSel, minSel, maxSel){
  const q = $(searchSel).value.trim().toLowerCase();
  const min = Number($(minSel).value || 0);
  const max = Number($(maxSel).value || 0);
  return list.filter(i => {
    const title = itemTitle(i).toLowerCase();
    return (!q || title.includes(q)) && (!min || i.price >= min) && (!max || i.price <= max);
  });
}

export function renderAll(){ renderTop(); renderSelected(); renderShop(); renderTargets(); renderChance(); }

export function renderTop(){
  $('#userBalance').textContent = fmt(state.profile?.balance || 0);
  $('#avatarLetter').textContent = (state.profile?.nickname || state.user?.email || 'U')[0].toUpperCase();
  $('#adminBtn').classList.toggle('hidden', state.profile?.role !== 'admin');
}

export function renderSelected(){
  const s = $('#selectedSource');
  const t = $('#selectedTarget');
  s.innerHTML = selectedMarkup(state.selectedSource);
  t.innerHTML = selectedMarkup(state.selectedTarget);
  s.classList.toggle('hidden', !state.selectedSource);
  t.classList.toggle('hidden', !state.selectedTarget);
  $('#sourcePanel .empty-select').classList.toggle('hidden', !!state.selectedSource);
  $('#targetPanel .empty-select').classList.toggle('hidden', !!state.selectedTarget);
}

export function renderShop(){
  const list = state.activeList === 'shop' ? state.catalog : inventoryArray();
  const filtered = filterList(list, '#shopSearch', '#shopMin', '#shopMax');
  $('#shopGrid').innerHTML = filtered.map(i => card(i, state.activeList, (state.activeList==='shop' ? state.selectedShop?.id===i.id : state.selectedSource?.instanceId===i.instanceId))).join('') || '<div class="muted">Ничего не найдено</div>';
  $('#buySelectedBtn').classList.toggle('hidden', state.activeList !== 'shop' || !state.selectedShop);
}

export function renderTargets(){
  let list = state.catalog;
  if (state.selectedSource) list = list.filter(i => Number(i.price) > Number(state.selectedSource.price));
  else list = [];
  list = filterList(list, '#targetSearch', '#targetMin', '#targetMax');
  $('#targetGrid').innerHTML = list.map(i => card(i, 'target', state.selectedTarget?.id===i.id)).join('') || `<div class="muted" style="padding:12px">Сначала выбери свой скин. Здесь будут только предметы дороже выбранного.</div>`;
}

export function renderChance(){
  const c = chance();
  const angle = Math.max(1, Math.min(270, c / 100 * 360));
  const wheel = $('#wheel');
  wheel.style.setProperty('--success-angle', `${angle}deg`);
  $('#chanceText').textContent = `${c.toFixed(2)}%`;
  $('#chanceLabel').textContent = state.selectedSource && state.selectedTarget ? 'шанс успеха' : 'выберите скин';
}

export async function buySelected(){
  if(!state.selectedShop) return toast('Выбери скин в магазине.');
  const price = Number(state.selectedShop.price);
  if(Number(state.profile?.balance || 0) < price) return toast('Недостаточно баланса.');
  await addBalance(state.user.uid, -price);
  await addInventoryItem(state.user.uid, state.selectedShop);
  toast('Скин куплен и добавлен в инвентарь.');
  state.selectedShop = null;
}

export async function sellInventoryItem(instanceId){
  const item = inventoryArray().find(i => i.instanceId === instanceId);
  if(!item) return toast('Предмет не найден.');
  const sellPrice = Math.floor(Number(item.price || 0));
  await removeInventoryItem(state.user.uid, instanceId);
  await addBalance(state.user.uid, sellPrice);
  if(state.selectedSource?.instanceId === instanceId) state.selectedSource = null;
  toast(`Продано: ${itemTitle(item)} за ◎ ${fmt(sellPrice)}.`);
  renderAll();
}

export async function sellAllInventoryItems(){
  const items = inventoryArray();
  if(!items.length) return toast('Инвентарь пуст.');
  const total = Math.floor(items.reduce((sum, item) => sum + Number(item.price || 0), 0));
  await Promise.all(items.map(item => removeInventoryItem(state.user.uid, item.instanceId)));
  await addBalance(state.user.uid, total);
  state.selectedSource = null;
  toast(`Продано предметов: ${items.length}. Получено ◎ ${fmt(total)}.`);
  renderAll();
}

function randomBetween(min, max){ return min + Math.random() * (max - min); }

export async function doUpgrade(){
  if(state.spinning) return;
  if(!state.selectedSource || !state.selectedTarget) return toast('Выбери свой скин и цель апгрейда.');
  if(Number(state.selectedTarget.price) <= Number(state.selectedSource.price)) return toast('Цель должна быть дороже твоего скина.');
  state.spinning = true;
  const c = chance();
  const successAngle = Math.max(1, Math.min(270, c / 100 * 360));
  const roll = Math.random() * 100;
  const success = roll <= c;

  // Колесо НЕ крутится. Крутится только стрелка вокруг центра.
  const targetAngle = success
    ? randomBetween(4, Math.max(5, successAngle - 4))
    : randomBetween(Math.min(359, successAngle + 8), 359);
  state.arrowRotation += 1440 + targetAngle;
  $('#wheelArrow').style.transform = `translateX(-50%) rotate(${state.arrowRotation}deg)`;
  $('#upgradeBtn').disabled = true;

  await new Promise(r => setTimeout(r, 1900));
  await removeInventoryItem(state.user.uid, state.selectedSource.instanceId);
  if(success){
    await addInventoryItem(state.user.uid, state.selectedTarget);
    await incStats(state.user.uid, 'wins');
    toast(`Успех! Выпал ${itemTitle(state.selectedTarget)}.`);
  } else {
    await incStats(state.user.uid, 'losses');
    toast('Неудача. Предмет сгорел.');
  }
  await incStats(state.user.uid, 'upgrades');
  await recordUpgrade({
    uid: state.user.uid,
    nickname: state.profile?.nickname || 'Player',
    chance: c,
    roll,
    sourceItem: state.selectedSource,
    targetItem: state.selectedTarget
  }, success);
  state.selectedSource = null;
  state.selectedTarget = null;
  state.preset = null;
  $('#upgradeBtn').disabled = false;
  state.spinning = false;
  renderAll();
}
