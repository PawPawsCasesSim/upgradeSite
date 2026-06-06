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
  spinning: false
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
  $('#chanceText').textContent = `${c.toFixed(2)}%`;
  $('#chanceLabel').textContent = state.selectedSource && state.selectedTarget ? 'средний шанс' : 'выберите скин';
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

export async function doUpgrade(){
  if(state.spinning) return;
  if(!state.selectedSource || !state.selectedTarget) return toast('Выбери свой скин и цель апгрейда.');
  if(Number(state.selectedTarget.price) <= Number(state.selectedSource.price)) return toast('Цель должна быть дороже твоего скина.');
  state.spinning = true;
  const c = chance();
  const roll = Math.random() * 100;
  const success = roll <= c;
  const extra = 1080 + Math.round(Math.random()*720) + (success ? 20 : 160);
  $('#wheel').style.transform = `rotate(${extra}deg)`;
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
