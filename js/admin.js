import { $, toast } from './ui.js';
import { FALLBACK_SKINS } from './items.js';
import { addBalance, addInventoryItem, adminLog } from './db.js';
import { state } from './upgrade.js';

export function initAdmin(){
  $('#adminItem').innerHTML = FALLBACK_SKINS.map(i => `<option value="${i.id}">${i.weapon} | ${i.name} — ${i.price}</option>`).join('');
  $('#adminBtn').addEventListener('click', () => $('#adminDialog').showModal());
  $('#grantBalanceBtn').addEventListener('click', grantBalance);
  $('#grantItemBtn').addEventListener('click', grantItem);
}

async function grantBalance(){
  const uid = $('#adminUid').value.trim();
  const amount = Number($('#adminBalance').value || 0);
  if(!uid || !amount) return toast('Укажи UID и сумму.');
  await addBalance(uid, amount);
  await adminLog({ adminUid: state.user.uid, action: 'grant_balance', targetUid: uid, amount });
  $('#adminMsg').textContent = `Выдано ${amount} монет игроку ${uid}`;
}

async function grantItem(){
  const uid = $('#adminUid').value.trim();
  const item = FALLBACK_SKINS.find(x => x.id === $('#adminItem').value);
  if(!uid || !item) return toast('Укажи UID и предмет.');
  await addInventoryItem(uid, item);
  await adminLog({ adminUid: state.user.uid, action: 'grant_item', targetUid: uid, item });
  $('#adminMsg').textContent = `Предмет выдан игроку ${uid}`;
}
