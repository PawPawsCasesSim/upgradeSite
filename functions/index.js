const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

setGlobalOptions({ maxInstances: 10 });

const CSFLOAT_API_KEY = "твой_ключ_сюда"; // ← вставить ключ

exports.getCSFloatItems = onRequest(async (req, res) => {
  // Разрешаем CORS для твоего GitHub Pages домена
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    const fetch = require("node-fetch");

    const response = await fetch(
      "https://csfloat.com/api/v1/listings?sort_by=most_recent&limit=50",
      { headers: { "Authorization": CSFLOAT_API_KEY } }
    );

    if (!response.ok) {
      throw new Error(`CSFloat вернул ${response.status}`);
    }

    const data = await response.json();

    const items = data.data.map(listing => ({
      id: listing.id,
      name: listing.item.market_hash_name,
      price: listing.price / 100,
      rarity: listing.item.rarity || "Unknown",
      weapon: listing.item.type || "Unknown",
      image: `https://steamcommunity-a.akamaihd.net/economy/image/${listing.item.icon_url}/360fx360f`,
      floatValue: listing.item.float_value
    }));

    res.json({ items });

  } catch (e) {
    logger.error("CSFloat fetch error", e);
    res.status(500).json({ error: e.message });
  }
});