const { onRequest } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
admin.initializeApp();

exports.health = onRequest((req, res) => {
  res.json({ ok: true, app: 'upgrader' });
});

// CSFloat API ключ нельзя хранить во фронтенде.
// Если понадобится загрузка реальных цен, сохрани ключ в Functions env/config
// и сделай отдельный proxy endpoint здесь.
