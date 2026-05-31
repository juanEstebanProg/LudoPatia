// ==========================================
//   CASINO DEL MINERO - GAME LOGIC v2
// ==========================================

// ——— STATE ———
let balance = 100;
let mineCooldown = false;

// ——— ACHIEVEMENTS DEFINITIONS ———
const ACHIEVEMENTS = [
  { id: 'win_50',      icon: '🥉', name: 'Primer Golpe',       desc: 'Gana $50 en una sola apuesta',      check: s => s.biggestWin >= 50 },
  { id: 'win_200',     icon: '🥈', name: 'Buena Mano',         desc: 'Gana $200 en una sola apuesta',     check: s => s.biggestWin >= 200 },
  { id: 'win_500',     icon: '🥇', name: 'Golpe de Suerte',    desc: 'Gana $500 en una sola apuesta',     check: s => s.biggestWin >= 500 },
  { id: 'win_1000',    icon: '💎', name: 'Millar de Oro',      desc: 'Gana $1,000 en una sola apuesta',   check: s => s.biggestWin >= 1000 },
  { id: 'win_5000',    icon: '🔥', name: 'En Llamas',          desc: 'Gana $5,000 en una sola apuesta',   check: s => s.biggestWin >= 5000 },
  { id: 'win_20000',   icon: '🌟', name: 'Leyenda del Casino', desc: 'Gana $20,000 en una sola apuesta',  check: s => s.biggestWin >= 20000 },
  { id: 'bal_500',     icon: '💰', name: 'Ahorrador',          desc: 'Acumula $500',                       check: s => s.peakBalance >= 500 },
  { id: 'bal_2000',    icon: '💵', name: 'Capitalista',        desc: 'Acumula $2,000',                     check: s => s.peakBalance >= 2000 },
  { id: 'bal_10000',   icon: '🏦', name: 'El Millonario',      desc: 'Acumula $10,000',                    check: s => s.peakBalance >= 10000 },
  { id: 'bal_50000',   icon: '🛥️', name: 'Mogul del Casino',   desc: 'Acumula $50,000',                    check: s => s.peakBalance >= 50000 },
  { id: 'mine_dwarf',  icon: '🧙', name: '¡Un Enano!',         desc: 'Encuentra al misterioso ser en la mina', check: s => s.foundDwarf },
  { id: 'mine_10',     icon: '⛏️', name: 'Minero Novato',      desc: 'Pica 10 piedras',                   check: s => s.mineCount >= 10 },
  { id: 'mine_50',     icon: '⛏️', name: 'Minero Veterano',    desc: 'Pica 50 piedras',                   check: s => s.mineCount >= 50 },
  { id: 'mine_upg5',   icon: '⚙️', name: 'Mina de Élite',     desc: 'Alcanza el nivel 5 de mejora',       check: s => s.mineUpgradeLevel >= 5 },
  { id: 'bj_blackjack',icon: '🃏', name: 'Blackjack!',         desc: 'Saca Blackjack natural (21)',        check: s => s.gotBlackjack },
  { id: 'crash_10x',   icon: '🚀', name: 'A la Luna',          desc: 'Retírate con x10 o más en Crash',   check: s => s.bestCashout >= 10 },
  { id: 'crash_50x',   icon: '☄️', name: 'Más Allá del Cielo', desc: 'Retírate con x50 o más en Crash',   check: s => s.bestCashout >= 50 },
  { id: 'slots_777',   icon: '7️⃣', name: 'Tres Sietes',        desc: 'Consigue 7️⃣7️⃣7️⃣ en las tragaperras', check: s => s.got777 },
  { id: 'roulette_5',  icon: '🔴', name: 'Racha Roja',         desc: 'Gana 5 veces seguidas en la ruleta', check: s => s.rouletteStreak >= 5 },
  { id: 'shop_first',  icon: '🧸', name: 'Coleccionista',      desc: 'Compra tu primer peluche',           check: s => s.plushOwned && s.plushOwned.length >= 1 },
  { id: 'shop_5',      icon: '🎀', name: 'Fan de Peluches',    desc: 'Colecciona 5 peluches',               check: s => s.plushOwned && s.plushOwned.length >= 5 },
];

// ——— PERSISTENT STATS ———
let stats = loadStats();

function loadStats() {
  try {
    const raw = localStorage.getItem('casinoStats');
    if (raw) return JSON.parse(raw);
  } catch(e) {}
  return {
    biggestWin: 0, peakBalance: 100, mineCount: 0, foundDwarf: false,
    gotBlackjack: false, bestCashout: 0, got777: false, rouletteStreak: 0,
    unlockedAchs: [], mineUpgradeLevel: 0, plushOwned: []
  };
}
function saveStats() {
  if (!stats.plushOwned) stats.plushOwned = [];
  try { localStorage.setItem('casinoStats', JSON.stringify(stats)); } catch(e) {}
}
function saveBalance() {
  try { localStorage.setItem('casinoBalance', String(balance)); } catch(e) {}
}
function loadBalance() {
  try {
    const b = localStorage.getItem('casinoBalance');
    if (b !== null) balance = parseFloat(b) || 100;
  } catch(e) {}
}

// ——— INIT ———
(function init() {
  loadBalance();
  if (!stats.plushOwned) stats.plushOwned = [];
  updateBalanceUI();
  renderAchievements();
  renderUpgradePanel();
})();

// ——— UI UTILS ———
function updateBalanceUI() {
  document.getElementById('balance-display').textContent = '$' + balance.toLocaleString('es-CO', { maximumFractionDigits: 0 });
  if (balance > stats.peakBalance) {
    stats.peakBalance = balance;
    saveStats();
    checkAchievements();
  }
  saveBalance();
}

function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
  if (screenId === 'screen-achievements') renderAchievements();
  if (screenId === 'screen-shop') renderShop();
  if (screenId === 'screen-work') renderUpgradePanel();
  if (screenId === 'screen-multiplier') setTimeout(() => drawWheel(wheelAngle), 50);
}

function toggleAchievements() {
  const s = document.getElementById('screen-achievements');
  const current = document.querySelector('.screen.active');
  if (current && current.id === 'screen-achievements') {
    goTo('screen-main');
  } else {
    goTo('screen-achievements');
  }
}

function showToast(msg, color) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.borderColor = color || 'var(--neon-gold)';
  t.style.color = color || 'var(--neon-gold)';
  t.classList.add('show');
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), 2800);
}

function getBet(inputId) {
  const val = parseInt(document.getElementById(inputId).value) || 0;
  if (val <= 0) { showToast('⚠️ Apuesta inválida'); return null; }
  if (val > balance) { showToast('💸 No tienes suficiente saldo', 'var(--neon-red)'); return null; }
  return val;
}

function recordWin(amount) {
  if (amount > stats.biggestWin) {
    stats.biggestWin = amount;
    saveStats();
  }
  checkAchievements();
}

// ——— ACHIEVEMENTS ———
function checkAchievements() {
  ACHIEVEMENTS.forEach(ach => {
    if (!stats.unlockedAchs.includes(ach.id) && ach.check(stats)) {
      stats.unlockedAchs.push(ach.id);
      saveStats();
      showAchievementPopup(ach);
      renderAchievements();
    }
  });
}

function showAchievementPopup(ach) {
  const pop = document.getElementById('achievement-popup');
  document.getElementById('ach-title-text').textContent = '🏆 LOGRO DESBLOQUEADO · ' + ach.name;
  document.getElementById('ach-desc-text').textContent = ach.desc;
  pop.classList.remove('hidden');
  pop.style.animation = 'none';
  void pop.offsetWidth;
  pop.style.animation = 'slideIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
  clearTimeout(pop._timer);
  pop._timer = setTimeout(() => {
    pop.style.animation = 'slideOut 0.4s ease forwards';
    setTimeout(() => pop.classList.add('hidden'), 400);
  }, 4000);
}

function renderAchievements() {
  const grid = document.getElementById('achievements-grid');
  if (!grid) return;
  grid.innerHTML = ACHIEVEMENTS.map(ach => {
    const unlocked = stats.unlockedAchs.includes(ach.id);
    return `<div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
      <div class="ach-card-icon">${ach.icon}</div>
      <div class="ach-card-info">
        <div class="ach-card-name">${ach.name}</div>
        <div class="ach-card-desc">${ach.desc}</div>
        <div class="ach-card-status ${unlocked ? 'done' : 'pending'}">${unlocked ? '✅ DESBLOQUEADO' : '🔒 BLOQUEADO'}</div>
      </div>
    </div>`;
  }).join('');
}

// ==========================================
//   MINERÍA + SISTEMA DE MEJORAS
// ==========================================

// Niveles de mejora: [descripción, costo, boostMultiplier]
// Los pesos base se multiplican para los drops buenos según el nivel
const MINE_UPGRADE_LEVELS = [
  { label: 'Nivel 0 — Sin mejoras',          cost: 0,        boost: 0    },
  { label: 'Nivel 1 — Pico de Hierro',        cost: 500,      boost: 0.3  },
  { label: 'Nivel 2 — Pico de Diamante',      cost: 2500,     boost: 0.7  },
  { label: 'Nivel 3 — Pico Encantado',        cost: 8000,     boost: 1.4  },
  { label: 'Nivel 4 — Pico Mítico',           cost: 25000,    boost: 2.2  },
  { label: 'Nivel 5 — Pico de Dragón',        cost: 75000,    boost: 3.5  },
  // Niveles absurdamente caros (legendarios)
  { label: 'Nivel 6 — Pico del Abismo',       cost: 500000,   boost: 5.0  },
  { label: 'Nivel 7 — Pico Celestial',        cost: 2500000,  boost: 7.5  },
  { label: 'Nivel 8 — El Pico Eterno',        cost: 15000000, boost: 12.0 },
];

// Base weights para cada drop (índices 0-6)
const MINE_DROPS_BASE = [
  { name: 'Nada',       emoji: '💨', value: 0,     baseW: 35  },
  { name: 'Carbón',     emoji: '🪨', value: 10,    baseW: 30  },
  { name: 'Cobre',      emoji: '🟤', value: 50,    baseW: 18  },
  { name: 'Hierro',     emoji: '⚙️', value: 150,   baseW: 10  },
  { name: 'Diamante',   emoji: '💎', value: 500,   baseW: 5   },
  { name: 'Esmeralda',  emoji: '💚', value: 1500,  baseW: 1.8 },
  { name: 'Enano',      emoji: '🧙', value: 10000, baseW: 0.2 }, // permanece bajo
];

// Calcula los pesos actuales según nivel de mejora
function getMineDrops() {
  const lvl = stats.mineUpgradeLevel || 0;
  const boost = MINE_UPGRADE_LEVELS[lvl] ? MINE_UPGRADE_LEVELS[lvl].boost : 0;

  return MINE_DROPS_BASE.map((d, i) => {
    let w = d.baseW;
    // boost mejora los drops de índice 2+ (Cobre en adelante), excepto Enano (índice 6)
    if (i >= 2 && i < 6) {
      w = d.baseW * (1 + boost);
      // también reducimos un poco "Nada" y "Carbón"
    }
    if (i === 0) w = Math.max(5, d.baseW - boost * 8);
    if (i === 1) w = Math.max(5, d.baseW - boost * 6);
    // Enano: permanece siempre en ~0.2
    return { ...d, weight: w };
  });
}

function weightedRandom(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) { r -= item.weight; if (r <= 0) return item; }
  return items[items.length - 1];
}

const MINE_COOLDOWN_MS = 2000;

function mineRock() {
  if (mineCooldown) return;
  mineCooldown = true;
  const btn = document.getElementById('rock-btn');
  btn.disabled = true;
  btn.querySelector('.rock-emoji').textContent = '💥';

  const drops = getMineDrops();
  const drop = weightedRandom(drops);
  const resultEl = document.getElementById('mine-result');

  setTimeout(() => {
    btn.querySelector('.rock-emoji').textContent = '🪨';
    if (drop.value > 0) {
      balance += drop.value;
      updateBalanceUI();

      // Enano: si no lo ha encontrado, mostrar incógnito en el resultado
      const isDwarf = drop.name === 'Enano';
      const alreadyFound = stats.foundDwarf;

      if (isDwarf && !alreadyFound) {
        resultEl.innerHTML = `❓ <span style="color:var(--neon-gold)">???</span> <span style="font-size:0.8em;color:var(--text-dim)">+$${drop.value.toLocaleString()}</span>`;
        showToast('❓ Algo misterioso aparece... +$10,000', 'var(--neon-purple)');
        stats.foundDwarf = true;
      } else if (isDwarf) {
        resultEl.innerHTML = `${drop.emoji} <span style="color:var(--neon-gold)">${drop.name}</span> +$${drop.value.toLocaleString()}`;
        showToast(`${drop.emoji} ${drop.name} +$${drop.value.toLocaleString()}`, 'var(--neon-gold)');
      } else {
        resultEl.innerHTML = `${drop.emoji} <span style="color:var(--neon-gold)">${drop.name}</span> +$${drop.value.toLocaleString()}`;
        showToast(`${drop.emoji} ${drop.name} +$${drop.value.toLocaleString()}`, drop.value >= 1500 ? 'var(--neon-green)' : 'var(--neon-gold)');
      }
    } else {
      resultEl.innerHTML = `💨 <span style="color:var(--text-dim)">Nada...</span>`;
    }

    stats.mineCount++;
    saveStats();
    checkAchievements();
    // Actualizar la tabla de drops para mostrar porcentajes actuales
    renderDropTable();

    // cooldown bar
    const wrap = document.getElementById('cooldown-wrap');
    const bar = document.getElementById('cooldown-bar');
    wrap.style.display = 'block';
    bar.style.width = '0%';
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 50;
      bar.style.width = (elapsed / MINE_COOLDOWN_MS * 100) + '%';
      if (elapsed >= MINE_COOLDOWN_MS) {
        clearInterval(interval);
        wrap.style.display = 'none';
        btn.disabled = false;
        mineCooldown = false;
      }
    }, 50);
  }, 400);
}

function renderDropTable() {
  const drops = getMineDrops();
  const total = drops.reduce((s, d) => s + d.weight, 0);
  const grid = document.getElementById('drop-grid-dynamic');
  if (!grid) return;

  grid.innerHTML = drops.map((d, i) => {
    const pct = ((d.weight / total) * 100).toFixed(1);
    const isDwarf = d.name === 'Enano';
    const revealed = stats.foundDwarf;
    const isRare = isDwarf;

    if (isDwarf && !revealed) {
      return `<div class="drop-item rare">
        <span>❓</span>
        <b>???</b>
        <span class="drop-val">???</span>
        <span style="font-size:0.65rem;color:var(--text-dim)">${pct}%</span>
      </div>`;
    }

    return `<div class="drop-item ${isRare ? 'rare' : ''}">
      <span>${d.emoji}</span>
      <b>${d.name}</b>
      <span class="drop-val">${d.value > 0 ? '$' + d.value.toLocaleString() : '$0'}</span>
      <span style="font-size:0.65rem;color:var(--text-dim)">${pct}%</span>
    </div>`;
  }).join('');
}

function renderUpgradePanel() {
  const lvl = stats.mineUpgradeLevel || 0;
  const MAX_LVL = MINE_UPGRADE_LEVELS.length - 1;
  const badge = document.getElementById('upgrade-level-badge');
  const info = document.getElementById('upgrade-info');
  const costLabel = document.getElementById('upgrade-cost-label');
  const btn = document.getElementById('upgrade-btn');
  const stars = document.getElementById('upgrade-stars');

  badge.textContent = 'Nivel ' + lvl;
  info.textContent = MINE_UPGRADE_LEVELS[lvl].label;

  // Stars display: 5 basic + 3 legendary
  stars.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('span');
    el.className = 'upgrade-star' + (i < Math.min(lvl, 5) ? ' active' : '');
    el.textContent = '⚙️';
    stars.appendChild(el);
  }
  for (let i = 5; i < 8; i++) {
    const el = document.createElement('span');
    el.className = 'upgrade-star' + (i < lvl ? ' active legendary' : '');
    el.textContent = '👑';
    stars.appendChild(el);
  }

  if (lvl >= MAX_LVL) {
    btn.disabled = true;
    btn.textContent = 'MAX';
    costLabel.innerHTML = `<span class="upgrade-maxed">✨ NIVEL MÁXIMO ✨</span>`;
  } else {
    const next = MINE_UPGRADE_LEVELS[lvl + 1];
    btn.disabled = false;
    btn.textContent = '⬆️ Mejorar';
    costLabel.textContent = `$${next.cost.toLocaleString()}`;
  }

  renderDropTable();
}

function buyMineUpgrade() {
  const lvl = stats.mineUpgradeLevel || 0;
  const MAX_LVL = MINE_UPGRADE_LEVELS.length - 1;
  if (lvl >= MAX_LVL) return;
  const next = MINE_UPGRADE_LEVELS[lvl + 1];
  if (balance < next.cost) {
    showToast(`💸 Necesitas $${next.cost.toLocaleString()}`, 'var(--neon-red)');
    return;
  }
  balance -= next.cost;
  stats.mineUpgradeLevel = lvl + 1;
  updateBalanceUI();
  saveStats();
  checkAchievements();
  renderUpgradePanel();
  showToast(`⚙️ ¡Mejora a Nivel ${stats.mineUpgradeLevel}!`, 'var(--neon-cyan)');
}

// ==========================================
//   TRAGAPERRAS (más lenta)
// ==========================================
const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '🎰', 'BAR', '7️⃣'];
const SLOT_WEIGHTS = [22, 18, 15, 12, 10, 8, 6, 5, 4];

function randomSymbol() {
  const total = SLOT_WEIGHTS.reduce((a,b) => a+b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SLOT_SYMBOLS.length; i++) { r -= SLOT_WEIGHTS[i]; if (r <= 0) return SLOT_SYMBOLS[i]; }
  return SLOT_SYMBOLS[0];
}

let slotsSpinning = false;
function spinSlots() {
  if (slotsSpinning) return;
  const bet = getBet('slots-bet');
  if (bet === null) return;
  balance -= bet;
  updateBalanceUI();
  slotsSpinning = true;

  const btn = document.getElementById('slots-spin-btn');
  btn.disabled = true;
  document.getElementById('slots-result').textContent = '';

  const reels = ['reel1','reel2','reel3'];
  const resultSpans = ['r1','r2','r3'];
  reels.forEach(id => document.getElementById(id).classList.add('spinning'));

  const finalSymbols = [randomSymbol(), randomSymbol(), randomSymbol()];
  // Más lento: 1.6s, 2.4s, 3.4s
  const delays = [1600, 2400, 3400];

  reels.forEach((id, i) => {
    setTimeout(() => {
      document.getElementById(id).classList.remove('spinning');
      document.getElementById(resultSpans[i]).textContent = finalSymbols[i];
      if (i === 2) {
        setTimeout(() => evaluateSlots(finalSymbols, bet), 300);
      }
    }, delays[i]);
  });
}

function evaluateSlots(syms, bet) {
  let mult = 0;
  let msg = '';
  const [a,b,c] = syms;

  if (a==='7️⃣' && b==='7️⃣' && c==='7️⃣') { mult=100; msg='🎉 TRES SIETES!! x100'; stats.got777=true; }
  else if (a==='BAR' && b==='BAR' && c==='BAR') { mult=50; msg='🎰 TRES BAR! x50'; }
  else if (a===b && b===c) {
    const rare = ['💎','🎰','⭐'];
    mult = rare.includes(a) ? 25 : 10;
    msg = `${a}${b}${c} x${mult}`;
  } else if (a===b || b===c || a===c) { mult=2; msg='Par! x2'; }

  slotsSpinning = false;
  const btn = document.getElementById('slots-spin-btn');
  btn.disabled = false;

  const resEl = document.getElementById('slots-result');
  if (mult > 0) {
    const win = bet * mult;
    balance += win;
    updateBalanceUI();
    resEl.className = 'slots-result win';
    resEl.textContent = msg + ' +$' + win.toLocaleString();
    showToast(`🎰 ${msg} +$${win.toLocaleString()}`, 'var(--neon-green)');
    recordWin(win);
    saveStats();
    checkAchievements();
  } else {
    resEl.className = 'slots-result lose';
    resEl.textContent = '😔 Sin premio';
  }
}

// ==========================================
//   RULETA MULTIPLICADORA (CANVAS WHEEL)
//   Nueva distribución: más x0/x1, x20 más pequeño
// ==========================================
const WHEEL_SEGMENTS = [
  { label: 'x2',  color: '#c41e3a', mult: 2  },
  { label: 'x0',  color: '#1a1a2e', mult: 0  },
  { label: 'x1',  color: '#2b2b40', mult: 1  },
  { label: 'x0',  color: '#1a1a2e', mult: 0  },
  { label: 'x3',  color: '#2d6a4f', mult: 3  },
  { label: 'x0',  color: '#1a1a2e', mult: 0  },
  { label: 'x2',  color: '#c41e3a', mult: 2  },
  { label: 'x1',  color: '#2b2b40', mult: 1  },
  { label: 'x0',  color: '#1a1a2e', mult: 0  },
  { label: 'x5',  color: '#c47f17', mult: 5  },
  { label: 'x0',  color: '#1a1a2e', mult: 0  },
  { label: 'x1',  color: '#2b2b40', mult: 1  },
  { label: 'x2',  color: '#c41e3a', mult: 2  },
  { label: 'x0',  color: '#1a1a2e', mult: 0  },
  { label: 'x3',  color: '#2d6a4f', mult: 3  },
  { label: 'x0',  color: '#1a1a2e', mult: 0  },
  { label: 'x20', color: '#b8860b', mult: 20 }, // más pequeño (1 segmento de 18)
  { label: 'x0',  color: '#1a1a2e', mult: 0  },
];

// Pesos customizados por segmento (el x20 tiene segmento mucho más pequeño visualmente via ángulo)
// Usamos ángulos proporcionales para hacerlo más pequeño:
const WHEEL_ANGLES = [
  24, // x2
  30, // x0
  20, // x1
  30, // x0
  20, // x3
  28, // x0
  24, // x2
  18, // x1
  30, // x0
  16, // x5
  28, // x0
  20, // x1
  24, // x2
  30, // x0
  20, // x3
  28, // x0
  8,  // x20 ← pequeño
  30, // x0
];
// Total debe ser 360
const WHEEL_TOTAL_DEG = WHEEL_ANGLES.reduce((a,b) => a+b, 0);

let wheelAngle = 0;
let wheelSpinning = false;

function drawWheel(angleRad) {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const r = cx - 10;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background circle
  ctx.beginPath();
  ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();

  let startDeg = -90; // pointer at top
  WHEEL_SEGMENTS.forEach((seg, i) => {
    const sliceDeg = (WHEEL_ANGLES[i] / WHEEL_TOTAL_DEG) * 360;
    const startRad = (startDeg * Math.PI / 180) + angleRad;
    const endRad = ((startDeg + sliceDeg) * Math.PI / 180) + angleRad;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startRad, endRad);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = '#0a0a12';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Text
    const midRad = (startRad + endRad) / 2;
    const textR = r * 0.68;
    ctx.save();
    ctx.translate(cx + textR * Math.cos(midRad), cy + textR * Math.sin(midRad));
    ctx.rotate(midRad + Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    // x20 smaller font
    const fontSize = seg.label === 'x20' ? 9 : (sliceDeg < 18 ? 10 : 13);
    ctx.font = `bold ${fontSize}px Bungee, sans-serif`;
    ctx.fillText(seg.label, 0, 0);
    ctx.restore();

    startDeg += sliceDeg;
  });

  // Center hub
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = '#f5c518';
  ctx.fill();
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function getWheelSegmentAtPointer(angleRad) {
  // Pointer is at top (-90 deg = -PI/2)
  // We need to find which segment is currently at top
  // Segments start at -90 deg and go clockwise
  // With rotation angleRad applied, the effective angle at top is:
  // segment startDeg + i*sliceDeg = 0 (top) in the rotated frame
  // -> normalize -angleRad to [0, 360)
  const normDeg = (((-angleRad * 180 / Math.PI) % 360) + 360) % 360;

  let cumDeg = 0;
  for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
    const sliceDeg = (WHEEL_ANGLES[i] / WHEEL_TOTAL_DEG) * 360;
    if (normDeg >= cumDeg && normDeg < cumDeg + sliceDeg) {
      return WHEEL_SEGMENTS[i];
    }
    cumDeg += sliceDeg;
  }
  return WHEEL_SEGMENTS[0];
}

function spinWheel() {
  if (wheelSpinning) return;
  const bet = getBet('wheel-bet');
  if (bet === null) return;
  balance -= bet;
  updateBalanceUI();
  wheelSpinning = true;
  document.getElementById('wheel-spin-btn').disabled = true;
  document.getElementById('wheel-result').textContent = '';

  // More rotations for drama: 8-12 full spins
  const spins = 8 + Math.random() * 4;
  const totalRot = spins * 2 * Math.PI + Math.random() * 2 * Math.PI;
  const duration = 6000; // 6 segundos — más emocionante
  const start = performance.now();
  const startAngle = wheelAngle;

  // Ease: empieza rápido, termina muy lento (para sensación de aguja moviéndose lenta)
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 4); }
  function easeOutSlow(t) {
    // Primero va normal, últimos 30% va muy lento
    if (t < 0.7) return easeOutCubic(t / 0.7) * 0.9;
    return 0.9 + easeOutCubic((t - 0.7) / 0.3) * 0.1;
  }

  function animate(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    wheelAngle = startAngle + totalRot * easeOutSlow(t);
    drawWheel(wheelAngle);
    if (t < 1) { requestAnimationFrame(animate); return; }

    const seg = getWheelSegmentAtPointer(wheelAngle);

    wheelSpinning = false;
    document.getElementById('wheel-spin-btn').disabled = false;

    const resEl = document.getElementById('wheel-result');
    if (seg.mult > 0) {
      const win = bet * seg.mult;
      balance += win;
      updateBalanceUI();
      resEl.className = 'wheel-result win';
      resEl.textContent = `${seg.label}! +$${win.toLocaleString()}`;
      showToast(`🎡 ${seg.label} +$${win.toLocaleString()}`, 'var(--neon-green)');
      recordWin(win);
    } else {
      resEl.className = 'wheel-result lose';
      resEl.textContent = '😔 x0 - Perdiste';
    }
  }
  requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', () => drawWheel(0));

// ==========================================
//   RULETA ROJO / NEGRO — Con animación de aguja y deceleration
// ==========================================
let rouletteRunning = false;
let rouletteStreakCount = 0;
let rouletteAngle = 0; // current rotation in degrees

function playRoulette(choice) {
  if (rouletteRunning) return;
  const bet = getBet('rou-bet');
  if (bet === null) return;
  balance -= bet;
  updateBalanceUI();
  rouletteRunning = true;

  const wheel = document.getElementById('rou-wheel');
  const inner = document.getElementById('rou-inner');
  const resEl = document.getElementById('rou-result');
  resEl.textContent = '';
  inner.textContent = '?';

  // Determine result first
  const r = Math.random() * 38;
  let result;
  if (r < 18) result = 'red';
  else if (r < 36) result = 'black';
  else result = 'green';

  // Animate wheel: fast then slow deceleration
  const totalSpins = 6 + Math.random() * 4; // 6-10 vueltas
  const totalDeg = totalSpins * 360 + Math.random() * 360;
  const duration = 5500; // 5.5 seconds
  const startTime = performance.now();
  const startAngle = rouletteAngle;

  function easeRouletteOut(t) {
    // Mostly fast, last 25% slows dramatically
    if (t < 0.75) return easeQuad(t / 0.75) * 0.92;
    return 0.92 + easeQuad((t - 0.75) / 0.25) * 0.08;
  }
  function easeQuad(t) { return 1 - (1 - t) * (1 - t); }

  function animateRoulette(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const eased = easeRouletteOut(t);
    rouletteAngle = startAngle + totalDeg * eased;
    wheel.style.transform = `rotate(${rouletteAngle}deg)`;

    if (t < 1) {
      requestAnimationFrame(animateRoulette);
    } else {
      // Done
      const resultEmojis = { red: '🔴', black: '⚫', green: '💚' };
      const mults = { red: 2, black: 2, green: 14 };
      inner.textContent = resultEmojis[result];
      rouletteRunning = false;

      if (choice === result) {
        const win = bet * mults[result];
        balance += win;
        updateBalanceUI();
        rouletteStreakCount++;
        stats.rouletteStreak = Math.max(stats.rouletteStreak, rouletteStreakCount);
        resEl.className = 'rou-result win';
        resEl.textContent = `${resultEmojis[result]} ¡Ganaste! +$${win.toLocaleString()}`;
        showToast(`${resultEmojis[result]} +$${win.toLocaleString()}`, 'var(--neon-green)');
        recordWin(win);
      } else {
        rouletteStreakCount = 0;
        resEl.className = 'rou-result lose';
        resEl.textContent = `${resultEmojis[result]} Salió ${result === 'red' ? 'Rojo' : result === 'black' ? 'Negro' : 'Verde'}. Perdiste.`;
      }
      saveStats();
      checkAchievements();
    }
  }
  requestAnimationFrame(animateRoulette);
}

// ==========================================
//   BLACKJACK
// ==========================================
const SUITS = ['♠','♥','♦','♣'];
const VALUES = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

let bjDeck = [];
let bjPlayerHand = [], bjDealerHand = [];
let bjBet = 0;
let bjGameActive = false;

function buildDeck() {
  const d = [];
  for (const s of SUITS) for (const v of VALUES) d.push({ suit: s, value: v });
  return d.sort(() => Math.random() - 0.5);
}

function cardValue(card) {
  if (['J','Q','K'].includes(card.value)) return 10;
  if (card.value === 'A') return 11;
  return parseInt(card.value);
}

function handTotal(hand) {
  let total = hand.reduce((s, c) => s + cardValue(c), 0);
  let aces = hand.filter(c => c.value === 'A').length;
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function cardHTML(card, hidden = false) {
  if (hidden) return `<div class="card back"></div>`;
  const red = ['♥','♦'].includes(card.suit);
  return `<div class="card ${red ? 'red' : ''}">${card.value}${card.suit}</div>`;
}

function renderBJHands(hideDealer = true) {
  const dCards = document.getElementById('bj-dealer-cards');
  const pCards = document.getElementById('bj-player-cards');
  dCards.innerHTML = bjDealerHand.map((c, i) => cardHTML(c, hideDealer && i === 1)).join('');
  pCards.innerHTML = bjPlayerHand.map(c => cardHTML(c)).join('');
  const dScore = document.getElementById('bj-dealer-score');
  const pScore = document.getElementById('bj-player-score');
  pScore.textContent = `(${handTotal(bjPlayerHand)})`;
  dScore.textContent = hideDealer ? '' : `(${handTotal(bjDealerHand)})`;
}

function startBlackjack() {
  const bet = getBet('bj-bet');
  if (bet === null) return;
  bjBet = bet;
  balance -= bet;
  updateBalanceUI();
  bjDeck = buildDeck();
  bjPlayerHand = [bjDeck.pop(), bjDeck.pop()];
  bjDealerHand = [bjDeck.pop(), bjDeck.pop()];
  bjGameActive = true;

  document.getElementById('bj-result').textContent = '';
  document.getElementById('bj-bet-area').classList.add('hidden');
  document.getElementById('bj-actions').classList.remove('hidden');
  renderBJHands(true);

  if (handTotal(bjPlayerHand) === 21) {
    stats.gotBlackjack = true;
    saveStats();
    bjStand();
  }
}

function bjHit() {
  if (!bjGameActive) return;
  bjPlayerHand.push(bjDeck.pop());
  renderBJHands(true);
  if (handTotal(bjPlayerHand) > 21) endBlackjack('bust');
}

function bjStand() {
  if (!bjGameActive) return;
  document.getElementById('bj-actions').classList.add('hidden');
  while (handTotal(bjDealerHand) < 17) bjDealerHand.push(bjDeck.pop());
  renderBJHands(false);
  const p = handTotal(bjPlayerHand), d = handTotal(bjDealerHand);
  if (d > 21 || p > d) endBlackjack('win');
  else if (p === d) endBlackjack('tie');
  else endBlackjack('lose');
}

function bjDouble() {
  if (!bjGameActive) return;
  if (bjBet > balance) { showToast('No tienes saldo para doblar', 'var(--neon-red)'); return; }
  balance -= bjBet;
  bjBet *= 2;
  updateBalanceUI();
  bjPlayerHand.push(bjDeck.pop());
  renderBJHands(true);
  if (handTotal(bjPlayerHand) > 21) { endBlackjack('bust'); return; }
  bjStand();
}

function endBlackjack(outcome) {
  bjGameActive = false;
  document.getElementById('bj-actions').classList.add('hidden');
  document.getElementById('bj-bet-area').classList.remove('hidden');
  renderBJHands(false);

  const resEl = document.getElementById('bj-result');
  const isNatural = bjPlayerHand.length === 2 && handTotal(bjPlayerHand) === 21;

  if (outcome === 'win') {
    const mult = isNatural ? 2.5 : 2;
    const win = Math.floor(bjBet * mult);
    balance += win;
    updateBalanceUI();
    resEl.className = 'bj-result win';
    resEl.textContent = (isNatural ? '🃏 BLACKJACK! ' : '✅ Ganaste! ') + '+$' + win.toLocaleString();
    showToast((isNatural ? '🃏 BLACKJACK! ' : '✅ Ganaste! ') + '+$' + win.toLocaleString(), 'var(--neon-green)');
    recordWin(win);
  } else if (outcome === 'tie') {
    balance += bjBet;
    updateBalanceUI();
    resEl.className = 'bj-result tie';
    resEl.textContent = '🤝 Empate — apuesta devuelta';
  } else {
    resEl.className = 'bj-result lose';
    resEl.textContent = '❌ Perdiste';
  }
  saveStats();
  checkAchievements();
}

// ==========================================
//   DADOS
// ==========================================
const DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
let diceRolling = false;

function rollDice(choice) {
  if (diceRolling) return;
  const bet = getBet('dice-bet');
  if (bet === null) return;
  balance -= bet;
  updateBalanceUI();
  diceRolling = true;

  const d1 = document.getElementById('die1');
  const d2 = document.getElementById('die2');
  d1.classList.add('rolling');
  d2.classList.add('rolling');

  let frames = 0;
  const maxFrames = 14 + Math.floor(Math.random() * 8);
  const interval = setInterval(() => {
    d1.textContent = DICE_FACES[Math.floor(Math.random()*6)];
    d2.textContent = DICE_FACES[Math.floor(Math.random()*6)];
    frames++;
    if (frames >= maxFrames) {
      clearInterval(interval);
      d1.classList.remove('rolling');
      d2.classList.remove('rolling');
      const v1 = Math.ceil(Math.random()*6);
      const v2 = Math.ceil(Math.random()*6);
      d1.textContent = DICE_FACES[v1-1];
      d2.textContent = DICE_FACES[v2-1];
      evaluateDice(choice, bet, v1, v2);
    }
  }, 80);
}

function evaluateDice(choice, bet, v1, v2) {
  diceRolling = false;
  const total = v1 + v2;
  const resEl = document.getElementById('dice-result');
  let win = 0;

  if (choice === 'high' && total >= 8) win = bet * 2;
  else if (choice === 'low' && total <= 6) win = bet * 2;
  else if (choice === 'double' && v1 === v2) win = bet * 5;

  if (win > 0) {
    balance += win;
    updateBalanceUI();
    resEl.className = 'dice-result win';
    resEl.textContent = `🎲 ${v1}+${v2}=${total} ¡Ganaste! +$${win.toLocaleString()}`;
    showToast(`🎲 +$${win.toLocaleString()}`, 'var(--neon-green)');
    recordWin(win);
  } else {
    resEl.className = 'dice-result lose';
    resEl.textContent = `🎲 ${v1}+${v2}=${total} — Perdiste`;
  }
  checkAchievements();
}

// ==========================================
//   CRASH
// ==========================================
let crashActive = false;
let crashMultiplier = 1.0;
let crashInterval = null;
let crashBet = 0;
let crashCrashPoint = 1.0;

function getCrashPoint() {
  const r = Math.random();
  if (r < 0.01) return 1.0;
  return Math.max(1.0, 0.99 / (1 - Math.random()));
}

function startCrash() {
  const bet = getBet('crash-bet');
  if (bet === null) return;
  if (crashActive) return;
  crashBet = bet;
  balance -= bet;
  updateBalanceUI();

  crashCrashPoint = getCrashPoint();
  crashMultiplier = 1.0;
  crashActive = true;

  document.getElementById('crash-start-btn').disabled = true;
  document.getElementById('crash-cashout-btn').classList.remove('hidden');
  document.getElementById('crash-result').textContent = '';

  const multEl = document.getElementById('crash-mult');
  const rocket = document.getElementById('crash-rocket');
  multEl.className = 'crash-multiplier';
  rocket.className = 'crash-rocket flying';

  const canvas = document.getElementById('crash-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let frame = 0;

  crashInterval = setInterval(() => {
    crashMultiplier += 0.03 + crashMultiplier * 0.005;
    frame++;

    multEl.textContent = crashMultiplier.toFixed(2) + 'x';
    if (crashMultiplier > 5) multEl.className = 'crash-multiplier danger';

    const x = Math.min(frame * 3, canvas.width - 10);
    const yRaw = canvas.height - 10 - (Math.log(crashMultiplier) * 40);
    const y = Math.max(10, yRaw);
    if (frame === 1) {
      ctx.beginPath();
      ctx.moveTo(0, canvas.height - 10);
      ctx.strokeStyle = '#39ff14';
      ctx.lineWidth = 2;
    }
    ctx.lineTo(x, y);
    ctx.stroke();

    if (crashMultiplier >= crashCrashPoint) {
      doCrash();
    }
  }, 100);
}

function cashoutCrash() {
  if (!crashActive) return;
  clearInterval(crashInterval);
  crashActive = false;
  const win = Math.floor(crashBet * crashMultiplier);
  balance += win;
  updateBalanceUI();

  document.getElementById('crash-cashout-btn').classList.add('hidden');
  document.getElementById('crash-start-btn').disabled = false;
  document.getElementById('crash-rocket').className = 'crash-rocket';

  const resEl = document.getElementById('crash-result');
  resEl.className = 'crash-result win';
  resEl.textContent = `💰 Retirado a ${crashMultiplier.toFixed(2)}x! +$${win.toLocaleString()}`;
  showToast(`🚀 x${crashMultiplier.toFixed(2)} +$${win.toLocaleString()}`, 'var(--neon-green)');

  if (crashMultiplier >= 10) stats.bestCashout = Math.max(stats.bestCashout, crashMultiplier);
  recordWin(win);
  saveStats();
  checkAchievements();
}

function doCrash() {
  clearInterval(crashInterval);
  crashActive = false;

  document.getElementById('crash-cashout-btn').classList.add('hidden');
  document.getElementById('crash-start-btn').disabled = false;
  document.getElementById('crash-rocket').className = 'crash-rocket crashed';
  document.getElementById('crash-mult').className = 'crash-multiplier danger';

  const resEl = document.getElementById('crash-result');
  resEl.className = 'crash-result lose';
  resEl.textContent = `💥 CRASH a ${crashCrashPoint.toFixed(2)}x — Perdiste $${crashBet.toLocaleString()}`;
  showToast(`💥 CRASH! Perdiste`, 'var(--neon-red)');
}

// ==========================================
//   TIENDA DE PELUCHES
// ==========================================
const PLUSHIES = [
  // Comunes
  { id: 'pl_bear',      emoji: '🐻', name: 'Oso Minero',       desc: 'Un oso con su casetito',         price: 200,      rarity: 'common'    },
  { id: 'pl_cat',       emoji: '🐱', name: 'Gatito del Casino', desc: 'Trae suerte... o eso dicen',     price: 350,      rarity: 'common'    },
  { id: 'pl_duck',      emoji: '🦆', name: 'Pato de la Suerte', desc: 'Para la bañera del millonario',  price: 150,      rarity: 'common'    },
  { id: 'pl_panda',     emoji: '🐼', name: 'Panda Apostador',   desc: 'Come bambú y fichas',            price: 450,      rarity: 'common'    },
  { id: 'pl_frog',      emoji: '🐸', name: 'Ranita de la Mina', desc: 'Encontrada en las cavernas',     price: 300,      rarity: 'common'    },
  // Raros
  { id: 'pl_fox',       emoji: '🦊', name: 'Zorro Tramposo',    desc: 'Sabe todos tus trucos',          price: 2500,     rarity: 'rare'      },
  { id: 'pl_wolf',      emoji: '🐺', name: 'Lobo de Wall Street',desc: 'Peluche ejecutivo',             price: 3800,     rarity: 'rare'      },
  { id: 'pl_owl',       emoji: '🦉', name: 'Búho Sabio',        desc: 'Conoce las probabilidades',      price: 4500,     rarity: 'rare'      },
  { id: 'pl_penguin',   emoji: '🐧', name: 'Pingüino Riquísimo',desc: 'Traje formal siempre',           price: 5000,     rarity: 'rare'      },
  // Épicos
  { id: 'pl_dragon',    emoji: '🐉', name: 'Dragón del Jackpot', desc: 'Guarda el tesoro de la mina',  price: 25000,    rarity: 'epic'      },
  { id: 'pl_unicorn',   emoji: '🦄', name: 'Unicornio de Oro',   desc: 'Solo los elegidos lo tienen',  price: 40000,    rarity: 'epic'      },
  { id: 'pl_phoenix',   emoji: '🦅', name: 'Ave Fénix Casino',   desc: 'Resurge de las pérdidas',      price: 60000,    rarity: 'epic'      },
  // Legendarios (absurdamente caros)
  { id: 'pl_alien',     emoji: '👾', name: 'Alien Millonario',   desc: 'Vino de otro planeta a ganar', price: 500000,   rarity: 'legendary' },
  { id: 'pl_crown',     emoji: '👑', name: 'La Corona del Rey',  desc: 'Hay un solo dueño posible',    price: 2000000,  rarity: 'legendary' },
  { id: 'pl_diamond',   emoji: '💎', name: 'El Diamante Eterno', desc: 'Ni a precio de mercado',       price: 10000000, rarity: 'legendary' },
];

function renderShop() {
  if (!stats.plushOwned) stats.plushOwned = [];
  const grid = document.getElementById('shop-grid');
  const ownedCount = document.getElementById('shop-owned-count');
  const totalCount = document.getElementById('shop-total-count');

  ownedCount.textContent = stats.plushOwned.length;
  totalCount.textContent = PLUSHIES.length;

  grid.innerHTML = PLUSHIES.map(p => {
    const owned = stats.plushOwned.includes(p.id);
    const rarityLabel = { common: 'COMÚN', rare: 'RARO', epic: 'ÉPICO', legendary: 'LEGENDARIO' }[p.rarity];
    const isLeg = p.rarity === 'legendary';
    return `<div class="shop-item ${owned ? 'owned' : ''}">
      <div class="shop-item-emoji">${p.emoji}</div>
      <div class="shop-item-name">${p.name}</div>
      <div class="shop-item-desc">${p.desc}</div>
      <div class="shop-item-rarity rarity-${p.rarity}">${rarityLabel}</div>
      <div class="shop-item-price ${isLeg ? 'legendary-price' : ''}">$${p.price.toLocaleString()}</div>
      ${owned
        ? `<button class="btn-owned">✅ Coleccionado</button>`
        : `<button class="btn-buy" onclick="buyPlush('${p.id}')" ${balance < p.price ? 'disabled' : ''}>🛒 Comprar</button>`
      }
    </div>`;
  }).join('');
}

function buyPlush(id) {
  if (!stats.plushOwned) stats.plushOwned = [];
  const p = PLUSHIES.find(x => x.id === id);
  if (!p) return;
  if (stats.plushOwned.includes(id)) { showToast('Ya tienes este peluche', 'var(--neon-cyan)'); return; }
  if (balance < p.price) { showToast('💸 No tienes suficiente saldo', 'var(--neon-red)'); return; }

  balance -= p.price;
  stats.plushOwned.push(id);
  updateBalanceUI();
  saveStats();
  checkAchievements();
  renderShop();
  showToast(`${p.emoji} ¡${p.name} añadido a tu colección!`, 'var(--neon-pink)');
}

// ==========================================
//   INITIAL DRAW
// ==========================================
setTimeout(() => {
  drawWheel(0);
  renderDropTable();
}, 100);