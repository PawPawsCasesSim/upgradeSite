// js/upgrade.js
import { processUpgrade } from "./db.js";
import { showToast } from "./ui.js";

let isSpinning = false;

// Нарисовать рулетку на canvas
export function drawRoulette(canvas, chancePercent) {
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const R = cx - 10;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Рассчитываем углы
  const winAngle = (chancePercent / 100) * 2 * Math.PI;
  const loseAngle = 2 * Math.PI - winAngle;

  // Фон круга
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.fillStyle = "#0d1117";
  ctx.fill();

  // Проигрышный сектор (красный) — занимает большую часть
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, R, -Math.PI / 2 + winAngle, -Math.PI / 2 + 2 * Math.PI);
  ctx.closePath();
  ctx.fillStyle = "#1a0408";
  ctx.fill();
  ctx.strokeStyle = "#ff1744";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Выигрышный сектор (зелёный)
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + winAngle);
  ctx.closePath();
  ctx.fillStyle = "#041a0a";
  ctx.fill();
  ctx.strokeStyle = "#00e676";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Граница секторов — линии
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(-Math.PI / 2) * R, cy + Math.sin(-Math.PI / 2) * R);
  ctx.strokeStyle = "#00e676";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(
    cx + Math.cos(-Math.PI / 2 + winAngle) * R,
    cy + Math.sin(-Math.PI / 2 + winAngle) * R
  );
  ctx.strokeStyle = "#ff1744";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Внешний ободок
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(0,212,255,0.3)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Центральный кружок
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, 2 * Math.PI);
  ctx.fillStyle = "#00d4ff";
  ctx.fill();

  // Текст шанса в зелёном секторе (если шанс >= 10%)
  if (chancePercent >= 10) {
    const midAngle = -Math.PI / 2 + winAngle / 2;
    const textR = R * 0.55;
    ctx.fillStyle = "#00e676";
    ctx.font = "bold 16px Rajdhani, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${chancePercent}%`,
      cx + Math.cos(midAngle) * textR,
      cy + Math.sin(midAngle) * textR
    );
  }
}

// Анимация стрелки
export async function spinRoulette(arrowEl, chancePercent, won) {
  if (isSpinning) return;
  isSpinning = true;

  // Определяем целевой угол
  // Зелёная зона: от 0 до winAngle (в градусах от вершины, т.е. -90°)
  const winDegrees = (chancePercent / 100) * 360;

  let targetDeg;
  if (won) {
    // Попадаем в зелёный сектор (от 0 до winDegrees)
    targetDeg = Math.random() * winDegrees * 0.8 + winDegrees * 0.1;
  } else {
    // Попадаем в красный сектор (от winDegrees до 360)
    targetDeg = winDegrees + Math.random() * (360 - winDegrees) * 0.8 + (360 - winDegrees) * 0.1;
  }

  // Добавляем 3–5 полных оборотов для эффекта
  const fullRotations = (3 + Math.floor(Math.random() * 3)) * 360;
  const finalDeg = fullRotations + targetDeg;

  // Применяем CSS-анимацию
  arrowEl.style.transition = "none";
  arrowEl.style.transform = "translateX(-50%) rotate(0deg)";

  await new Promise(r => setTimeout(r, 50));

  const duration = 3500 + Math.random() * 1000;
  arrowEl.style.transition = `transform ${duration}ms cubic-bezier(0.17, 0.67, 0.12, 1.0)`;
  arrowEl.style.transform = `translateX(-50%) rotate(${finalDeg}deg)`;

  await new Promise(r => setTimeout(r, duration + 100));

  isSpinning = false;
  return finalDeg;
}

// Сбросить стрелку
export function resetArrow(arrowEl) {
  arrowEl.style.transition = "none";
  arrowEl.style.transform = "translateX(-50%) rotate(0deg)";
}

// Основная функция апгрейда
export async function runUpgrade(uid, sourceItem, targetItem, chancePercent, onResult) {
  if (isSpinning) return;

  const arrowEl = document.getElementById("roulette-arrow");
  const upgradeBtn = document.getElementById("upgrade-btn");
  const btnText = upgradeBtn.querySelector(".upgrade-btn-text");

  upgradeBtn.disabled = true;
  btnText.textContent = "ИДЁТ АПГРЕЙД...";

  try {
    // 1. Выполняем апгрейд на "сервере" (Firebase)
    const result = await processUpgrade(uid, sourceItem, targetItem, chancePercent);

    // 2. Анимируем стрелку к результату
    await spinRoulette(arrowEl, chancePercent, result.won);

    // 3. Показываем результат
    onResult(result.won, targetItem);

    // Звуки
    playSound(result.won ? "win" : "lose");

  } catch (e) {
    showToast("Ошибка апгрейда: " + e.message, "error");
  } finally {
    upgradeBtn.disabled = false;
    btnText.textContent = "АПГРЕЙД";
  }
}

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "win") {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start(); osc.stop(ctx.currentTime + 0.8);
    } else {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.4);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
      osc.start(); osc.stop(ctx.currentTime + 0.9);
    }
  } catch (e) {
    // Audio not available
  }
}
