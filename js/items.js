export const FALLBACK_SKINS = [
  { id:'ak-cartel', weapon:'AK-47', name:'Cartel', wear:'FN', price:779, rarity:'blue', image:'https://community.cloudflare.steamstatic.com/economy/image/class/730/3107779471/256fx192f' },
  { id:'m4-arctic-wolf', weapon:'M4A1-S', name:'Arctic Wolf', wear:'MW', price:779, rarity:'purple', image:'https://community.cloudflare.steamstatic.com/economy/image/class/730/4441843881/256fx192f' },
  { id:'ak-redline', weapon:'AK-47', name:'Redline', wear:'FT', price:4500, rarity:'purple', image:'https://community.cloudflare.steamstatic.com/economy/image/class/730/3107779063/256fx192f' },
  { id:'awp-asiimov', weapon:'AWP', name:'Asiimov', wear:'FT', price:18000, rarity:'red', image:'https://community.cloudflare.steamstatic.com/economy/image/class/730/3107767939/256fx192f' },
  { id:'ak-bloodsport', weapon:'AK-47', name:'Bloodsport', wear:'FN', price:35000, rarity:'red', image:'https://community.cloudflare.steamstatic.com/economy/image/class/730/1761857174/256fx192f' },
  { id:'m4-howl', weapon:'M4A4', name:'Howl', wear:'FN', price:1759835, rarity:'red', image:'https://community.cloudflare.steamstatic.com/economy/image/class/730/3107779380/256fx192f' }
];

const MAX_CARDS_ON_SCREEN = 520;
export { MAX_CARDS_ON_SCREEN };

export async function loadCatalogFromCsapi() {
  const sources = [
    'data/cs2-skins.json',
    'https://raw.githubusercontent.com/qwkdev/csapi/main/data2.json',
    'https://cdn.jsdelivr.net/gh/qwkdev/csapi@main/data2.json'
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url, { cache: 'force-cache' });
      if (!res.ok) continue;
      const json = await res.json();
      const values = Array.isArray(json) ? json : Object.values(json || {});
      const loaded = values.map((x, i) => normalizeSkin(x, i)).filter(i => i.image && i.weapon && i.name && i.price);
      if (loaded.length) return mergeCatalog(FALLBACK_SKINS, loaded);
    } catch (e) {}
  }
  return FALLBACK_SKINS;
}

const WEAR_MAP = {
  'Factory New': 'FN',
  'Minimal Wear': 'MW',
  'Field-Tested': 'FT',
  'Well-Worn': 'WW',
  'Battle-Scarred': 'BS'
};

const RARITY_MAP = {
  'Consumer Grade': 'common',
  'Industrial Grade': 'common',
  'Base Grade': 'common',
  'Mil-Spec Grade': 'blue',
  'High Grade': 'blue',
  'Restricted': 'purple',
  'Remarkable': 'purple',
  'Classified': 'pink',
  'Exotic': 'pink',
  'Covert': 'red',
  'Contraband': 'red',
  'Extraordinary': 'gold',
  'Master': 'gold'
};

const BASE_PRICE = { common: 70, blue: 220, purple: 850, pink: 2600, red: 8500, gold: 25000 };
const WEAR_MUL = { FN: 1.65, MW: 1.25, FT: 1, WW: .82, BS: .68 };
const SPECIAL_PRICE = [
  ['dragon lore', 900000], ['gungnir', 1000000], ['howl', 1500000], ['wild lotus', 1200000],
  ['fire serpent', 420000], ['medusa', 480000], ['poseidon', 250000], ['doppler ruby', 800000],
  ['doppler sapphire', 750000], ['emerald', 700000], ['fade', 250000], ['lore', 180000],
  ['printstream', 42000], ['asiimov', 18000], ['bloodsport', 35000], ['vulcan', 65000], ['hydroponic', 250000]
];

function hashCode(text){
  let h = 0;
  for (let i = 0; i < text.length; i++) h = Math.imul(31, h) + text.charCodeAt(i) | 0;
  return Math.abs(h);
}

function rarityFromRaw(raw, name){
  const r = String(raw.rarity || '');
  for (const [key, value] of Object.entries(RARITY_MAP)) if (r.toLowerCase().includes(key.toLowerCase())) return value;
  const n = String(name || '').toLowerCase();
  if(/knife|bayonet|karambit|gloves|wraps/.test(n)) return 'gold';
  return 'blue';
}

function syntheticPrice(item, raw = {}){
  const text = `${item.weapon} ${item.name}`.toLowerCase();
  for (const [key, price] of SPECIAL_PRICE) {
    if (text.includes(key)) return Math.round(price * (0.85 + (hashCode(item.id) % 31) / 100) * (WEAR_MUL[item.wear] || 1));
  }
  const rarity = item.rarity || 'blue';
  const base = BASE_PRICE[rarity] || 300;
  const spread = hashCode(`${item.id}-${item.wear}`) % Math.max(1, base * 6);
  const typeMul = raw.type === 'StatTrak' ? 1.45 : raw.type === 'Souvenir' ? 1.25 : 1;
  return Math.max(10, Math.round((base + spread) * (WEAR_MUL[item.wear] || 1) * typeMul));
}

export function normalizeSkin(raw, index = 0) {
  // Уже нормализованный локальный каталог.
  if (raw.id && raw.weapon && raw.name && raw.price && raw.image) return raw;

  const fullName = raw['full-name'] || raw.market_hash_name || raw.name || `${raw.weapon || 'Skin'} ${raw.finish || ''}`.trim();
  const split = String(raw.name || fullName).split('|');
  const weapon = raw.weapon || split[0]?.trim() || 'Skin';
  let skinName = raw.finish || raw.skin || split[1]?.replace(/\(.+\)/,'').trim() || String(raw.name || fullName).replace(`${weapon} |`, '').trim();
  if (raw.type && raw.type !== 'Normal' && !skinName.includes(raw.type)) skinName += ` ${raw.type}`;
  const exterior = raw.exterior || raw.wear || (String(fullName).match(/\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/)?.[1]) || 'Factory New';
  const item = {
    id: raw.id || `${raw.type || 'Normal'}-${fullName}-${index}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    weapon,
    name: skinName,
    wear: WEAR_MAP[exterior] || exterior,
    rarity: rarityFromRaw(raw, fullName),
    image: raw.image || raw.icon_url || raw.icon || '',
    price: Number(raw.price || raw.priceUsd || raw.min_price || raw.reference?.base_price || 0)
  };
  if (!item.price) item.price = syntheticPrice(item, raw);
  return item;
}

function mergeCatalog(base, extra){
  const map = new Map();
  [...base, ...extra].forEach(item => map.set(item.id, item));
  return [...map.values()].sort((a,b) => Number(a.price) - Number(b.price));
}
