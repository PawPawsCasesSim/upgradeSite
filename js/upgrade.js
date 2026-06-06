import { FALLBACK_SKINS, MAX_CARDS_ON_SCREEN } from './items.js';
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
  desiredChance: null,
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
  const source = Number(state.selectedSource.price || 0);
  const target = Number(state.selectedTarget.price || 0);
  if (!source || !target || target <= source) return 0;
  const c = (source / target) * 100;
  return Math.max(0.01, Math.min(75, c));
}

function visibleSlice(list){
  const sliced = list.slice(0, MAX_CARDS_ON_SCREEN);
  const more = list.length > MAX_CARDS_ON_SCREEN
    ? `<div class="list-note">Показано ${MAX_CARDS_ON_SCREEN} из ${list.length}. Используй поиск или фильтр цены.</div>`
    : '';
  return { sliced, more };
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

function targetsForSelectedSource(){
  if (!state.selectedSource) return [];
  const minPriceForMaxChance = Number(state.selectedSource.price) / 0.75;
  return state.catalog.filter(i => Number(i.price) >= minPriceForMaxChance);
}

export function desiredChanceFromPreset(value){
  const v = String(value || '');
  if (v === '2') return 50;
  if (v === '4') return 25;
  if (v === '8') return 12.5;
  return Math.max(0.01, Math.min(75, Number(v || 0)));
}

export function autoSelectTargetByChance(targetChance){
  if (!state.selectedSource || !targetChance) return false;
  const sourcePrice = Number(state.selectedSource.price);
  const wantedPrice = sourcePrice * 100 / Number(targetChance);
  const candidates = targetsForSelectedSource();
  if (!candidates.length) return false;
  let best = candidates[0];
  let bestScore = Infinity;
  for (const item of candidates) {
    const itemChance = Math.min(75, (sourcePrice / Number(item.price)) * 100);
    const priceDiff = Math.abs(Number(item.price) - wantedPrice) / Math.max(1, wantedPrice);
    const chanceDiff = Math.abs(itemChance - targetChance) / Math.max(1, targetChance);
    const score = chanceDiff * 5 + priceDiff;
    if (score < bestScore) { bestScore = score; best = item; }
  }
  state.selectedTarget = best;
  return true;
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
  const { sliced, more } = visibleSlice(filtered);
  $('#shopGrid').innerHTML = sliced.map(i => card(i, state.activeList, (state.activeList==='shop' ? state.selectedShop?.id===i.id : state.selectedSource?.instanceId===i.instanceId))).join('') + more || '<div class="muted">Ничего не найдено</div>';
  $('#buySelectedBtn').classList.toggle('hidden', state.activeList !== 'shop' || !state.selectedShop);
}

export function renderTargets(){
  let list = targetsForSelectedSource();
  list = filterList(list, '#targetSearch', '#targetMin', '#targetMax');
  const { sliced, more } = visibleSlice(list);
  $('#targetGrid').innerHTML = state.selectedSource
    ? (sliced.map(i => card(i, 'target', state.selectedTarget?.id===i.id)).join('') + more || `<div class="muted" style="padding:12px">Нет предметов под фильтры.</div>`)
    : `<div class="muted" style="padding:12px">Сначала выбери свой скин. Здесь будут только предметы дороже выбранного и с шансом не выше 75%.</div>`;
}

export function renderChance(){
  const c = chance();
  const angle = Math.max(0, Math.min(270, c / 100 * 360));
  $('#wheel').style.setProperty('--success-angle', `${angle}deg`);
  $('#chanceText').textContent = `${c.toFixed(2)}%`;
  $('#chanceLabel').textContent = state.selectedSource && state.selectedTarget ? 'шанс успеха' : 'выберите скин';
  document.querySelectorAll('.chance-presets button').forEach(btn => {
    btn.classList.toggle('active', Number(desiredChanceFromPreset(btn.dataset.preset)) === Number(state.desiredChance || -1));
  });
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
  const successAngle = Math.max(0.36, Math.min(270, c / 100 * 360));

  // Визуальный результат и фактический результат теперь считаются из одной точки.
  // Если стрелка остановилась в синем секторе — победа, если в тёмном — проигрыш.
  const successRoll = Math.random() * 100 <= c;
  const safeGap = Math.min(2.5, Math.max(0.15, successAngle / 8));
  const finalAngle = successRoll
    ? randomBetween(safeGap, Math.max(safeGap + 0.05, successAngle - safeGap))
    : randomBetween(Math.min(359, successAngle + safeGap + 2), 359);
  const success = finalAngle <= successAngle;
  const roll = finalAngle / 360 * 100;

  const current = ((state.arrowRotation % 360) + 360) % 360;
  const delta = ((finalAngle - current + 360) % 360);
  state.arrowRotation += 1440 + delta;
  $('#wheelArrow').style.transform = `rotate(${state.arrowRotation}deg)`;
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
  state.desiredChance = null;
  $('#upgradeBtn').disabled = false;
  state.spinning = false;
  renderAll();
}
