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
  selectedSources: [],
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

export function selectedSources(){
  return Array.isArray(state.selectedSources) ? state.selectedSources : [];
}

export function selectedSourceValue(){
  return selectedSources().reduce((sum, item) => sum + Number(item.price || 0), 0);
}

export function syncSelectedSource(){
  const items = selectedSources();
  if(!items.length){ state.selectedSource = null; return; }
  const price = selectedSourceValue();
  state.selectedSource = {
    id: 'multi-source',
    instanceId: items.map(i => i.instanceId).join('|'),
    weapon: items.length === 1 ? items[0].weapon : `${items.length} предметов`,
    name: items.length === 1 ? items[0].name : 'выбрано для апгрейда',
    image: items[0]?.image || '',
    rarity: items[0]?.rarity || 'blue',
    price,
    items
  };
}

export function toggleSourceItem(item){
  if(!item) return false;
  const items = selectedSources();
  const exists = items.some(i => i.instanceId === item.instanceId);
  if(exists){
    state.selectedSources = items.filter(i => i.instanceId !== item.instanceId);
    syncSelectedSource();
    return true;
  }
  if(items.length >= 5){
    toast('Можно поставить максимум 5 предметов за один апгрейд.');
    return false;
  }
  state.selectedSources = [...items, item];
  syncSelectedSource();
  return true;
}

export function clearSelectedSources(){
  state.selectedSources = [];
  syncSelectedSource();
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

function selectedSourceSelectedMarkup(){
  const items = selectedSources();
  if(!items.length) return '';
  if(items.length === 1) return selectedMarkup(items[0]);
  const thumbs = items.slice(0,5).map(i => i.image ? `<img src="${i.image}" alt="">` : '').join('');
  return `<div class="selected-stack">${thumbs}</div><div><b>${items.length} предметов в апгрейде</b><span>◎ ${fmt(selectedSourceValue())}</span><small>Максимум 5 предметов</small></div>`;
}

export function renderTop(){
  $('#userBalance').textContent = fmt(state.profile?.balance || 0);
  $('#avatarLetter').textContent = (state.profile?.nickname || state.user?.email || 'U')[0].toUpperCase();
  $('#adminBtn').classList.toggle('hidden', state.profile?.role !== 'admin');
}

export function renderSelected(){
  const s = $('#selectedSource');
  const t = $('#selectedTarget');
  s.innerHTML = selectedSourceSelectedMarkup();
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
  $('#shopGrid').innerHTML = sliced.map(i => card(i, state.activeList, (state.activeList==='shop' ? state.selectedShop?.id===i.id : selectedSources().some(x => x.instanceId===i.instanceId)))).join('') + more || '<div class="muted">Ничего не найдено</div>';
  $('#buyControls').classList.toggle('hidden', state.activeList !== 'shop' || !state.selectedShop);
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
  // 0deg = 12 часов, 180deg = 6 часов.
  // Сектор успеха всегда ЦЕНТРИРОВАН на 6 часах и расходится в обе стороны поровну.
  const sectorStart = (180 - angle / 2 + 360) % 360;
  $('#wheel').style.setProperty('--success-angle', `${angle}deg`);
  $('#wheel').style.setProperty('--sector-start', `${sectorStart}deg`);
  $('#chanceText').textContent = `${c.toFixed(2)}%`;
  $('#chanceLabel').textContent = state.selectedSource && state.selectedTarget ? 'шанс успеха' : 'выберите скин';
  document.querySelectorAll('.chance-presets button').forEach(btn => {
    btn.classList.toggle('active', Number(desiredChanceFromPreset(btn.dataset.preset)) === Number(state.desiredChance || -1));
  });
}

export async function buySelected(){
  if(!state.selectedShop) return toast('Выбери скин в магазине.');
  const qtyInput = $('#buyQty');
  const qty = Math.max(1, Math.min(99, Math.floor(Number(qtyInput?.value || 1))));
  const price = Number(state.selectedShop.price);
  const total = price * qty;
  if(Number(state.profile?.balance || 0) < total) return toast(`Недостаточно баланса. Нужно ◎ ${fmt(total)}.`);
  await addBalance(state.user.uid, -total);
  for(let i = 0; i < qty; i++) await addInventoryItem(state.user.uid, state.selectedShop);
  toast(`Куплено: ${qty} шт. за ◎ ${fmt(total)}.`);
  state.selectedShop = null;
}

export async function sellInventoryItem(instanceId){
  const item = inventoryArray().find(i => i.instanceId === instanceId);
  if(!item) return toast('Предмет не найден.');
  const sellPrice = Math.floor(Number(item.price || 0));
  await removeInventoryItem(state.user.uid, instanceId);
  await addBalance(state.user.uid, sellPrice);
  if(selectedSources().some(i => i.instanceId === instanceId)){ state.selectedSources = selectedSources().filter(i => i.instanceId !== instanceId); syncSelectedSource(); }
  toast(`Продано: ${itemTitle(item)} за ◎ ${fmt(sellPrice)}.`);
  renderAll();
}

export async function sellAllInventoryItems(){
  const items = inventoryArray();
  if(!items.length) return toast('Инвентарь пуст.');
  const total = Math.floor(items.reduce((sum, item) => sum + Number(item.price || 0), 0));
  await Promise.all(items.map(item => removeInventoryItem(state.user.uid, item.instanceId)));
  await addBalance(state.user.uid, total);
  clearSelectedSources();
  toast(`Продано предметов: ${items.length}. Получено ◎ ${fmt(total)}.`);
  renderAll();
}

function randomBetween(min, max){ return min + Math.random() * (max - min); }
function normDeg(v){ return ((v % 360) + 360) % 360; }
function angleInSector(angle, start, size){
  const rel = normDeg(angle - start);
  return rel >= 0 && rel <= size;
}
function nearSectorBorder(angle, start, size, gap){
  const rel = normDeg(angle - start);
  return rel < gap || Math.abs(rel - size) < gap || Math.abs(rel - 360) < gap;
}

export async function doUpgrade(){
  if(state.spinning) return;
  if(!state.selectedSource || !state.selectedTarget) return toast('Выбери свой скин и цель апгрейда.');
  if(Number(state.selectedTarget.price) <= Number(state.selectedSource.price)) return toast('Цель должна быть дороже твоего скина.');
  state.spinning = true;
  const c = chance();
  const successAngle = Math.max(0.36, Math.min(270, c / 100 * 360));
  // Синий сектор ЦЕНТРИРОВАН снизу: середина сектора = 180deg / 6 часов.
  const sectorStart = normDeg(180 - successAngle / 2);

  // ВАЖНО: результат теперь берётся из того же угла, куда реально прилетела стрелка.
  // Поэтому если стрелка визуально в синем секторе — это победа, если в тёмном — проигрыш.
  const borderGap = 2.2;
  let finalAngle = Math.random() * 360;
  for (let i = 0; i < 25 && nearSectorBorder(finalAngle, sectorStart, successAngle, borderGap); i++) {
    finalAngle = Math.random() * 360;
  }
  const success = angleInSector(finalAngle, sectorStart, successAngle);
  const relativeCheck = normDeg(finalAngle - sectorStart);
  const roll = relativeCheck / 360 * 100;

  const duration = Math.floor(8000 + Math.random() * 3000);
  const current = normDeg(state.arrowRotation);
  const delta = normDeg(finalAngle - current);
  state.arrowRotation += 2160 + delta;
  const arrow = $('#wheelArrow');
  arrow.style.transitionDuration = `${duration}ms`;
  arrow.style.transform = `rotate(${state.arrowRotation}deg)`;
  $('#upgradeBtn').disabled = true;

  await new Promise(r => setTimeout(r, duration + 150));
  const usedItems = selectedSources();
  const sourceSnapshot = { ...state.selectedSource, items: usedItems };
  for (const item of usedItems) await removeInventoryItem(state.user.uid, item.instanceId);
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
    sourceItem: sourceSnapshot,
    targetItem: state.selectedTarget
  }, success);
  clearSelectedSources();
  state.selectedTarget = null;
  state.desiredChance = null;
  $('#upgradeBtn').disabled = false;
  state.spinning = false;
  renderAll();
}
