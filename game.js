// ==========================================
//   CASINO DEL MINERO - GAME LOGIC
// ==========================================

// ——— STATE ———
let balance = 100;
let mineCooldown = false;

// ——— ACHIEVEMENTS DEFINITIONS ———
const ACHIEVEMENTS = [
  // Ganar en una sola apuesta
  { id: 'win_50',      icon: '🥉', name: 'Primer Golpe',       desc: 'Gana $50 en una sola apuesta',      check: s => s.biggestWin >= 50 },
  { id: 'win_200',     icon: '🥈', name: 'Buena Mano',         desc: 'Gana $200 en una sola apuesta',     check: s => s.biggestWin >= 200 },
  { id: 'win_500',     icon: '🥇', name: 'Golpe de Suerte',    desc: 'Gana $500 en una sola apuesta',     check: s => s.biggestWin >= 500 },
  { id: 'win_1000',    icon: '💎', name: 'Millar de Oro',      desc: 'Gana $1,000 en una sola apuesta',   check: s => s.biggestWin >= 1000 },
  { id: 'win_5000',    icon: '🔥', name: 'En Llamas',          desc: 'Gana $5,000 en una sola apuesta',   check: s => s.biggestWin >= 5000 },
  { id: 'win_20000',   icon: '🌟', name: 'Leyenda del Casino', desc: 'Gana $20,000 en una sola apuesta',  check: s => s.biggestWin >= 20000 },
  // Acumular dinero
  { id: 'bal_500',     icon: '💰', name: 'Ahorrador',          desc: 'Acumula $500',                       check: s => s.peakBalance >= 500 },
  { id: 'bal_2000',    icon: '💵', name: 'Capitalista',        desc: 'Acumula $2,000',                     check: s => s.peakBalance >= 2000 },
  { id: 'bal_10000',   icon: '🏦', name: 'El Millonario',      desc: 'Acumula $10,000',                    check: s => s.peakBalance >= 10000 },
  { id: 'bal_50000',   icon: '🛥️', name: 'Mogul del Casino',   desc: 'Acumula $50,000',                    check: s => s.peakBalance >= 50000 },
  // Minería
  { id: 'mine_dwarf',  icon: '🧙', name: '¡Un Enano!',         desc: 'Encuentra al enano en la mina',     check: s => s.foundDwarf },
  { id: 'mine_10',     icon: '⛏️', name: 'Minero Novato',      desc: 'Pica 10 piedras',                   check: s => s.mineCount >= 10 },
  { id: 'mine_50',     icon: '⛏️', name: 'Minero Veterano',    desc: 'Pica 50 piedras',                   check: s => s.mineCount >= 50 },
  // Juegos específicos
  { id: 'bj_blackjack',icon: '🃏', name: 'Blackjack!',         desc: 'Saca Blackjack natural (21)',        check: s => s.gotBlackjack },
  { id: 'crash_10x',   icon: '🚀', name: 'A la Luna',          desc: 'Retírate con x10 o más en Crash',   check: s => s.bestCashout >= 10 },
  { id: 'crash_50x',   icon: '☄️', name: 'Más Allá del Cielo', desc: 'Retírate con x50 o más en Crash',   check: s => s.bestCashout >= 50 },
  { id: 'slots_777',   icon: '7️⃣', name: 'Tres Sietes',        desc: 'Consigue 7️⃣7️⃣7️⃣ en las tragaperras', check: s => s.got777 },
  { id: 'roulette_5',  icon: '🔴', name: 'Racha Roja',         desc: 'Gana 5 veces seguidas en la ruleta', check: s => s.rouletteStreak >= 5 },
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
    unlockedAchs: []
  };
}
function saveStats() {
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
  updateBalanceUI();
  renderAchievements();
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
//   MINERÍA
// ==========================================
const MINE_DROPS = [
  { name: 'Nada',       emoji: '💨', value: 0,     weight: 35 },
  { name: 'Carbón',     emoji: '🪨', value: 10,    weight: 30 },
  { name: 'Cobre',      emoji: '🟤', value: 50,    weight: 18 },
  { name: 'Hierro',     emoji: '⚙️', value: 150,   weight: 10 },
  { name: 'Diamante',   emoji: '💎', value: 500,   weight: 5  },
  { name: 'Esmeralda',  emoji: '💚', value: 1500,  weight: 1.8},
  { name: 'Enano',      emoji: '🧙', value: 10000, weight: 0.2},
];

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

  const drop = weightedRandom(MINE_DROPS);
  const resultEl = document.getElementById('mine-result');

  // animate
  setTimeout(() => {
    btn.querySelector('.rock-emoji').textContent = '🪨';
    if (drop.value > 0) {
      balance += drop.value;
      updateBalanceUI();
      resultEl.innerHTML = `${drop.emoji} <span style="color:var(--neon-gold)">${drop.name}</span> + $${drop.value.toLocaleString()}`;
      showToast(`${drop.emoji} ${drop.name} +$${drop.value.toLocaleString()}`, drop.value >= 1500 ? 'var(--neon-green)' : 'var(--neon-gold)');
    } else {
      resultEl.innerHTML = `💨 <span style="color:var(--text-dim)">Nada...</span>`;
    }

    stats.mineCount++;
    if (drop.name === 'Enano') stats.foundDwarf = true;
    saveStats();
    checkAchievements();

    // cooldown bar
    const wrap = document.getElementById('cooldown-wrap');
    const bar = document.getElementById('cooldown-bar');
    const label = document.getElementById('cooldown-label');
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

// ==========================================
//   TRAGAPERRAS
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
  const delays = [800, 1200, 1600];

  reels.forEach((id, i) => {
    setTimeout(() => {
      document.getElementById(id).classList.remove('spinning');
      document.getElementById(resultSpans[i]).textContent = finalSymbols[i];
      if (i === 2) evaluateSlots(finalSymbols, bet);
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
// ==========================================
const WHEEL_SEGMENTS = [
  { label: 'x2',  color: '#c41e3a', mult: 2  },
  { label: 'x3',  color: '#2d6a4f', mult: 3  },
  { label: 'x1',  color: '#2b2b40', mult: 1  },
  { label: 'x5',  color: '#c47f17', mult: 5  },
  { label: 'x0',  color: '#1a1a2e', mult: 0  },
  { label: 'x2',  color: '#c41e3a', mult: 2  },
  { label: 'x10', color: '#7b2d8b', mult: 10 },
  { label: 'x0',  color: '#1a1a2e', mult: 0  },
  { label: 'x3',  color: '#2d6a4f', mult: 3  },
  { label: 'x1',  color: '#2b2b40', mult: 1  },
  { label: 'x20', color: '#b8860b', mult: 20 },
  { label: 'x0',  color: '#1a1a2e', mult: 0  },
];

let wheelAngle = 0;
let wheelSpinning = false;

function drawWheel(angle) {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const r = cx - 10;
  const n = WHEEL_SEGMENTS.length;
  const arc = (2 * Math.PI) / n;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  WHEEL_SEGMENTS.forEach((seg, i) => {
    const start = angle + i * arc - Math.PI / 2;
    const end = start + arc;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = '#0a0a12';
    ctx.lineWidth = 2;
    ctx.stroke();

    // text
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Bungee, sans-serif';
    ctx.fillText(seg.label, r - 12, 5);
    ctx.restore();
  });

  // center
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#f5c518';
  ctx.fill();
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

  const totalRot = 5 * 2 * Math.PI + Math.random() * 2 * Math.PI;
  const duration = 3500;
  const start = performance.now();
  const startAngle = wheelAngle;

  function easeOut(t) { return 1 - Math.pow(1 - t, 4); }

  function animate(now) {
    const elapsed = now - start;
    const t = Math.min(elapsed / duration, 1);
    wheelAngle = startAngle + totalRot * easeOut(t);
    drawWheel(wheelAngle);
    if (t < 1) { requestAnimationFrame(animate); return; }

    // determine result: pointer is at top (270° = -PI/2), so find which segment is under it
    const n = WHEEL_SEGMENTS.length;
    const arc = (2 * Math.PI) / n;
    const normalized = (((-wheelAngle) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const segIndex = Math.floor(normalized / arc) % n;
    const seg = WHEEL_SEGMENTS[segIndex];

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

// Draw initial wheel when screen is visible
document.addEventListener('DOMContentLoaded', () => drawWheel(0));
// Also draw when showing multiplier screen
const origGoTo = goTo;
window.goTo = function(id) {
  origGoTo(id);
  if (id === 'screen-multiplier') setTimeout(() => drawWheel(wheelAngle), 50);
};

// ==========================================
//   RULETA ROJO / NEGRO
// ==========================================
let rouletteRunning = false;
let rouletteStreakCount = 0;

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

  // spin animation
  let spins = 0;
  const maxSpins = 20 + Math.floor(Math.random() * 15);
  let deg = 0;
  const spinInterval = setInterval(() => {
    deg += 25;
    wheel.style.transform = `rotate(${deg}deg)`;
    spins++;
    if (spins >= maxSpins) {
      clearInterval(spinInterval);
      wheel.style.transform = '';
      resolvRoulette(choice, bet, resEl, inner);
    }
  }, 60);
}

function resolvRoulette(choice, bet, resEl, inner) {
  // 18 red, 18 black, 2 green out of 38
  const r = Math.random() * 38;
  let result;
  if (r < 18) result = 'red';
  else if (r < 36) result = 'black';
  else result = 'green';

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

  // Blackjack natural?
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
  // dealer draws
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
  // House edge ~5%, provably fair style
  const r = Math.random();
  if (r < 0.01) return 1.0; // instant crash 1%
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

  // Draw canvas line
  const canvas = document.getElementById('crash-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let frame = 0;

  crashInterval = setInterval(() => {
    crashMultiplier += 0.03 + crashMultiplier * 0.005;
    frame++;

    multEl.textContent = crashMultiplier.toFixed(2) + 'x';
    if (crashMultiplier > 5) multEl.className = 'crash-multiplier danger';

    // Draw graph
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
//   INITIAL DRAW
// ==========================================
setTimeout(() => drawWheel(0), 100);
