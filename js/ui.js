export const $ = s => document.querySelector(s);
export const $$ = s => [...document.querySelectorAll(s)];
export const fmt = n => Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
export function toast(text){ const el=$('#toast'); el.textContent=text; el.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove('show'),2600); }
export function itemTitle(i){ return `${i.weapon || ''} | ${i.name || ''}`.replace(/^ \| /,''); }
export function card(item, mode, active=false){
  return `<button class="skin-card rarity-${item.rarity || 'blue'} ${active?'active':''}" data-mode="${mode}" data-id="${item.instanceId || item.id}">
    <div class="price">◎ ${fmt(item.price)}</div>
    ${item.image ? `<img src="${item.image}" alt="">` : ''}
    <div class="name">${item.name || itemTitle(item)}</div>
    <div class="type">${item.weapon || 'Skin'}</div><div class="wear">${item.wear || ''}</div>
  </button>`;
}
export function selectedMarkup(item){
  if(!item) return '';
  return `${item.image ? `<img src="${item.image}" alt="">` : ''}<div><b>${itemTitle(item)}</b><span>◎ ${fmt(item.price)}</span></div>`;
}
export function liveDropMarkup(drop){
  const t=drop.targetItem||{};
  const nick=drop.nickname||'Player';
  return `<button class="live-card" title="${nick} • шанс ${Number(drop.chance||0).toFixed(2)}%" data-uid="${drop.uid}">
    <div class="live-chance">⌃ ${Number(drop.chance||0).toFixed(2)}%</div>
    <div class="live-name">${t.name || 'Skin'}</div>
    <div class="live-weapon">${t.weapon || ''}</div>
    ${t.image ? `<img src="${t.image}" alt="">` : ''}
  </button>`;
}
