import { $, toast } from './ui.js';
import { addBalance, addInventoryItem, adminLog, findUserByNickname } from './db.js';
import { state } from './upgrade.js';

export function fillAdminItems(){
  const list = state.catalog || [];
  $('#adminItem').innerHTML = list.map(i => `<option value="${i.id}">${i.weapon} | ${i.name} ${i.wear || ''} — ${i.price}</option>`).join('');
}

export function initAdmin(){
  fillAdminItems();
  $('#adminBtn').addEventListener('click', () => $('#adminDialog').showModal());
  $('#grantBalanceBtn').addEventListener('click', grantBalance);
  $('#grantItemBtn').addEventListener('click', grantItem);
}

async function resolveTargetUser(){
  const nickname = $('#adminNickname').value.trim();
  if(!nickname){
    toast('Укажи ник игрока.');
    return null;
  }
  const found = await findUserByNickname(nickname);
  if(!found){
    toast(`Игрок с ником ${nickname} не найден.`);
    $('#adminMsg').textContent = `Игрок с ником ${nickname} не найден. Проверь точное написание ника.`;
    return null;
  }
  if(found.duplicate){
    toast('Найдено несколько игроков с таким ником.');
    $('#adminMsg').textContent = `Найдено несколько игроков с ником ${nickname}. Попроси игрока сменить ник или выдай вручную через Firebase.`;
    return null;
  }
  return found;
}

async function grantBalance(){
  const target = await resolveTargetUser();
  const amount = Number($('#adminBalance').value || 0);
  if(!target || !amount) return toast('Укажи ник и сумму.');
  await addBalance(target.uid, amount);
  await adminLog({ adminUid: state.user.uid, action: 'grant_balance', targetUid: target.uid, targetNickname: target.nickname, amount });
  $('#adminMsg').textContent = `Выдано ${amount} монет игроку ${target.nickname} (${target.uid})`;
}

async function grantItem(){
  const target = await resolveTargetUser();
  const item = (state.catalog || []).find(x => x.id === $('#adminItem').value);
  if(!target || !item) return toast('Укажи ник и предмет.');
  await addInventoryItem(target.uid, item);
  await adminLog({ adminUid: state.user.uid, action: 'grant_item', targetUid: target.uid, targetNickname: target.nickname, item });
  $('#adminMsg').textContent = `Предмет выдан игроку ${target.nickname} (${target.uid})`;
}
