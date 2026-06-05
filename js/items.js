// js/items.js
const CSFLOAT_API_KEY = "8_FPa9KzhoP_-1QZMdv8pTn8EaXNlVY_";

const MOCK_ITEMS = [
  { id: "ak47_redline", name: "AK-47 | Redline", price: 15.20, rarity: "Classified", weapon: "AK-47", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszOeC9H_9mkhIWFg8j1OO-GqWlD6dN-teHE9Jrs0Fo8rRpkYWn1JoKUJlQ4NQzX_FTqwOrqhZa5tJuLnHU8pSghCEig/360fx360f" },
  { id: "m4a4_temukau", name: "M4A4 | 龍王 (Dragon King)", price: 45.00, rarity: "Covert", weapon: "M4A4", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITCmX5d_MQijLqSqNP3i1Ky5kRrZG3yIoaVdlVqNQ/360fx360f" },
  { id: "awp_neo_noir", name: "AWP | Neo-Noir", price: 28.50, rarity: "Covert", weapon: "AWP", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5m0mvLwOq7c2GoE6pd1i-jSqNuiils8rRpkamOmdoWUIwRvZl3TqFi-w-3v15O_tZ7IngM/360fx360f" },
  { id: "glock_fade", name: "Glock-18 | Fade", price: 320.00, rarity: "Restricted", weapon: "Glock-18", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqMA9fwszYI2gT09-vloWZkuLxPqjVm1Rd4MRjj-v--Y3nj1fz-ENvZ2HxdtOScw82YVuErFTqwOrqhZa6TP0wZQ/360fx360f" },
  { id: "usps_kill_confirmed", name: "USP-S | Kill Confirmed", price: 67.00, rarity: "Covert", weapon: "USP-S", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpoo6m1FBRp3_bGcjhQ09-vq4WZkuLxPqjVm1Rd4MRjj-v--Y3nj1HzrBVtNW_2LNXBd1A3aliBqFC5kuq9hJK7ucmawXNr/360fx360f" },
  { id: "m9_doppler", name: "M9 Bayonet | Doppler", price: 850.00, rarity: "Covert", weapon: "M9 Bayonet", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf0Ob3Yi5nu4nhxsrEkuf8MrndqWhe5sN4mOTE8bTijVe1qkE6ZWj7LY-RdQ84YQyDr1C-ye3s18DvuM_IxHhHuCgm/360fx360f" },
  { id: "karambit_slaughter", name: "Karambit | Slaughter", price: 1200.00, rarity: "Covert", weapon: "Karambit", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf1ObcTihRu4myq4-PhOf7Ia_ummpD18B1i_vNot-hjVDm_kFpZm72doHCIQdqMFiDqgC8yOe605Xpus2bm3M3pSgj5HzD30VgKufCwfc/360fx360f" },
  { id: "ak47_vulcan", name: "AK-47 | Vulcan", price: 88.00, rarity: "Covert", weapon: "AK-47", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszOeC9H_9mkhIWFg8j1OO-GqWlD6dN-teHE9JrvxVHh_RY_N2H0do_AcFU2ZFRX-FO5x-e605Xpus2b-QaUxQ/360fx360f" },
  { id: "desert_eagle_blaze", name: "Desert Eagle | Blaze", price: 520.00, rarity: "Restricted", weapon: "Desert Eagle", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposr-kLAtl7PDdTjlH7du6kb-HnvD8J_WGkGoHv8Ap2u2UodzkxVG1r0c9YWj7IYTAIFBqM1nQqVTsx-2-hMDo7XyblXFrvCkrtQ/360fx360f" },
  { id: "mp5_lab_rats", name: "MP5-SD | Lab Rats", price: 12.50, rarity: "Mil-Spec", weapon: "MP5-SD", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou6ryFAR17PLfYQJH4920k4SDkvb3PajUl21F7fp9g_qVoNqhiQTg-BBpNWj1cIXAdg83aVTSrFTrw-fg18C5vJjNiHhg/360fx360f" },
  { id: "p250_sand_dune", name: "P250 | Sand Dune", price: 0.85, rarity: "Consumer Grade", weapon: "P250", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpopuP1FBRp3_bGcjhQ09-vq4WZkuLxPqjVm1Rd4MRjj-v--Y3nj1exrEo9YGqmIteRewlsYgvUqlG8xeu8hZa6vdTNngNs/360fx360f" },
  { id: "famas_waters_edge", name: "FAMAS | Waters of Nephthys", price: 9.20, rarity: "Mil-Spec", weapon: "FAMAS", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpoitazhlderYvdeTxH_tmkq4GBm_P7Iq_ul2pS5sN4mrGVoIPqkFC8rBY5NzGiLdCXIAI6Zlq0-VS4x-_v5-9t3pjmxIVw/360fx360f" },
  { id: "awp_dragon_lore", name: "AWP | Dragon Lore", price: 8500.00, rarity: "Covert", weapon: "AWP", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAZh7PLfYQJS_8O4moWfqPv9ILSP2TsG6sB1j-uS9tWj2FC1rxE-YGH3ctOUJlQ3aQqDrwC-ye3s18Dklt3PMfhfYw/360fx360f" },
  { id: "m4a1_knight", name: "M4A1-S | Knight", price: 680.00, rarity: "Covert", weapon: "M4A1-S", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO_mr-ZkvP9J6vQl2xu5Mx2gv3--Y3nj1GzqRVvYWn3ddKUdFM2NFHV-Vnsw-3nhcK7ot6Y0g/360fx360f" },
  { id: "sg_hypnotic", name: "SG 553 | Hypnotic", price: 35.00, rarity: "Classified", weapon: "SG 553", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpgg6qpERFf0Ob3Yi5nu4nvwIqMgua8PL_Dl2pE18h9j-_Iqo7xjQL6_UVvMGH3d4TGJQY7MlzUr1Dsx-rqhMe96MwpnXZiuCc/360fx360f" },
  { id: "nova_koi", name: "Nova | Koi", price: 4.50, rarity: "Industrial Grade", weapon: "Nova", image: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX3oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou7umeldf0Ob3ZTxSuomknYyvkPmlYePTxj5S18l4n_TB9oqt2lbj-UBtMGj2LtSWcwY_ZFrRrlC6k-_u0pbquchX9c/360fx360f" },
];

let cachedItems = null;

export async function loadMarketItems() {
  if (cachedItems) return cachedItems;
  try {
    const items = await fetchCSFloatItems();
    cachedItems = items;
    return items;
  } catch (e) {
    console.warn("CSFloat недоступен, используются тестовые данные:", e.message);
    cachedItems = MOCK_ITEMS;
    return MOCK_ITEMS;
  }
}

async function fetchCSFloatItems() {
  const targetUrl = encodeURIComponent(
    "https://csfloat.com/api/v1/listings?sort_by=most_recent&limit=50"
  );
  const response = await fetch(
    `https://corsproxy.io/?${targetUrl}`,
    { headers: { "Authorization": CSFLOAT_API_KEY } }
  );
  if (!response.ok) throw new Error(`CSFloat error: ${response.status}`);
  const data = await response.json();
  return data.data.map(listing => ({
    id: listing.id,
    name: listing.item.market_hash_name,
    price: listing.price / 100,
    rarity: listing.item.rarity || "Unknown",
    weapon: listing.item.type || "Unknown",
    image: `https://steamcommunity-a.akamaihd.net/economy/image/${listing.item.icon_url}/360fx360f`,
    floatValue: listing.item.float_value
  }));
}

export function findTargetItems(sourcePrice, chancePercent, allItems) {
  let minPrice, maxPrice;
  if (chancePercent === 50) {
    minPrice = sourcePrice * 1.8;
    maxPrice = sourcePrice * 2.2;
  } else if (chancePercent === 30) {
    minPrice = sourcePrice / 0.30 * 0.9;
    maxPrice = sourcePrice / 0.30 * 1.1;
  } else if (chancePercent === 10) {
    minPrice = sourcePrice / 0.10 * 0.9;
    maxPrice = sourcePrice / 0.10 * 1.1;
  } else if (chancePercent === 5) {
    minPrice = sourcePrice / 0.05 * 0.9;
    maxPrice = sourcePrice / 0.05 * 1.1;
  } else if (chancePercent === 3) {
    minPrice = sourcePrice / 0.03 * 0.9;
    maxPrice = sourcePrice / 0.03 * 1.1;
  } else {
    minPrice = sourcePrice / (chancePercent / 100) * 0.85;
    maxPrice = sourcePrice / (chancePercent / 100) * 1.15;
  }
  return allItems.filter(item => item.price >= minPrice && item.price <= maxPrice);
}

export function calculateChance(sourcePrice, targetPrice) {
  if (!targetPrice || targetPrice <= 0) return 0;
  const chance = (sourcePrice / targetPrice) * 100;
  return Math.min(95, Math.max(0.1, chance));
}

export function getRarityColor(rarity) {
  const colors = {
    "Consumer Grade": "#b0c3d9",
    "Industrial Grade": "#5e98d9",
    "Mil-Spec Grade": "#4b69ff",
    "Mil-Spec": "#4b69ff",
    "Restricted": "#8847ff",
    "Classified": "#d32ce6",
    "Covert": "#eb4b4b",
    "Contraband": "#e4ae39",
  };
  return colors[rarity] || "#888";
}

export function formatPrice(price) {
  return `$${Number(price).toFixed(2)}`;
}