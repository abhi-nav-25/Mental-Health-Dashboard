/* ============================================================
   CARE.IO — app.js  (shared logic + routing)
   ============================================================ */

/* ── Theme ── */
const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  const icon  = document.getElementById('theme-icon');
  const label = document.getElementById('theme-label');
  if (theme === 'dark') {
    icon.textContent  = '☀️';
    label.textContent = 'Light Mode';
  } else {
    icon.textContent  = '🌙';
    label.textContent = 'Dark Mode';
  }
  localStorage.setItem('careio-theme', theme);
}

function toggleTheme() {
  const current = root.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

/* ── Toast ── */
function showToast(msg = '✓ Saved successfully!') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── Storage helpers ── */
function store(key, value) {
  try { localStorage.setItem('careio-' + key, JSON.stringify(value)); } catch(e) {}
}
function retrieve(key, fallback = null) {
  try {
    const v = localStorage.getItem('careio-' + key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch(e) { return fallback; }
}

/* ── Navigation ── */
function initNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const page = item.dataset.page;
      store('lastPage', page);
      loadPage(page);
    });
  });
}

function loadPage(page) {
  const frame = document.getElementById('content-frame');
  if (frame) frame.src = `pages/${page}.html`;
}

/* ── Init on load ── */
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = retrieve('careio-theme') || 'dark';
  applyTheme(savedTheme);
  initNav();

  // Highlight active nav item
  const lastPage = retrieve('lastPage') || 'home';
  const activeItem = document.querySelector(`.nav-item[data-page="${lastPage}"]`);
  if (activeItem) activeItem.classList.add('active');
  loadPage(lastPage);
});

/* ============================================================
   HEALTH SCORE
   ============================================================ */
function initHealthScore() {
  updateSliders();
  document.querySelectorAll('.factor-slider').forEach(sl => {
    sl.addEventListener('input', updateSliders);
  });
  drawRing(getCurrentScore());
}

function updateSliders() {
  [1,2,3,4].forEach(i => {
    const sl = document.getElementById('sl'+i);
    if (!sl) return;
    document.getElementById('sl'+i+'v').textContent = sl.value + '/10';
  });
  const score = getCurrentScore();
  const ringVal = document.getElementById('ringScoreVal');
  const ringLbl = document.querySelector('.ring-label');
  const barFill = document.getElementById('scoreBarFill');
  if (ringVal) ringVal.textContent = score;
  if (ringLbl) ringLbl.textContent = getScoreLabel(score);
  if (barFill)  barFill.style.width = score + '%';
  drawRing(score);
}

function getCurrentScore() {
  const vals = [1,2,3,4].map(i => {
    const el = document.getElementById('sl'+i);
    return el ? parseInt(el.value) : 7;
  });
  return Math.round((vals.reduce((a,b)=>a+b,0) / 40) * 100);
}

function getScoreLabel(s) {
  if (s >= 80) return 'Excellent';
  if (s >= 60) return 'Good';
  if (s >= 40) return 'Fair';
  return 'Needs Care';
}

let ringChart = null;
function drawRing(score) {
  const canvas = document.getElementById('scoreRing');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const isDark = root.getAttribute('data-theme') === 'dark';
  if (ringChart) ringChart.destroy();
  ringChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [score, 100 - score],
        backgroundColor: ['#00d4c8', isDark ? '#1c2330' : '#e8eef5'],
        borderWidth: 0,
        circumference: 270,
        rotation: 225
      }]
    },
    options: {
      cutout: '80%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { duration: 600 }
    }
  });
}

function saveHealth() {
  store('healthScore', { score: getCurrentScore(), ts: Date.now() });
  showToast('✓ Health score saved!');
}

/* ============================================================
   MOOD TRACKER
   ============================================================ */
function initMoodTracker() {
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
  drawMoodChart();
}

function saveMood() {
  const selected = document.querySelector('.mood-btn.selected');
  if (!selected) { showToast('⚠ Please select a mood first'); return; }
  showToast(`✓ Mood "${selected.dataset.mood}" saved!`);
  store('mood', { mood: selected.dataset.mood, ts: Date.now() });
}

let moodChart = null;
function drawMoodChart() {
  const ctx = document.getElementById('moodChart');
  if (!ctx) return;
  const isDark = root.getAttribute('data-theme') === 'dark';
  const gc = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tc = isDark ? '#8b949e' : '#718096';
  if (moodChart) moodChart.destroy();
  moodChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [{
        data: [4,3,5,4,3,5,4],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168,85,247,0.1)',
        tension: 0.4, fill: true, pointRadius: 5,
        pointBackgroundColor: '#a855f7'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min:1, max:5, grid:{color:gc}, ticks:{color:tc} },
        x: { grid:{color:gc}, ticks:{color:tc} }
      }
    }
  });
}

/* ============================================================
   STRESS MONITOR
   ============================================================ */
const stressData = {
  emojis:  ['','😌','😊','😕','😐','😟','😧','😰','😱','😤','🤯'],
  labels:  ['','Very Calm','Calm','Mild','Moderate','Stressed','Tense','Anxious','Very Anxious','Severe','Extreme'],
  colors:  ['','#4ade80','#4ade80','#86efac','#facc15','#fb923c','#f97316','#ef4444','#dc2626','#b91c1c','#7f1d1d']
};

function initStressMonitor() {
  const slider = document.getElementById('stressSlider');
  if (slider) {
    slider.addEventListener('input', function() { updateStressDisplay(parseInt(this.value)); });
    updateStressDisplay(parseInt(slider.value));
  }
  drawStressChart();
}

function updateStressDisplay(v) {
  const emoji = document.getElementById('stressEmoji');
  const label = document.getElementById('stressLabelText');
  const score = document.getElementById('stressScore');
  if (emoji)  emoji.textContent      = stressData.emojis[v];
  if (label) { label.textContent     = stressData.labels[v]; label.style.color = stressData.colors[v]; }
  if (score) { score.textContent     = `● ${v}/10`; score.style.color = stressData.colors[v]; score.style.background = stressData.colors[v] + '22'; }
}

function toggleSymptom(el) { el.classList.toggle('active'); }

function saveStress() {
  const v = document.getElementById('stressSlider')?.value || 3;
  const active = [...document.querySelectorAll('.symptom-tag.active')].map(t => t.textContent);
  store('stress', { level: v, symptoms: active, ts: Date.now() });
  showToast('✓ Stress entry saved!');
}

let stressChart = null;
function drawStressChart() {
  const ctx = document.getElementById('stressChart');
  if (!ctx) return;
  const isDark = root.getAttribute('data-theme') === 'dark';
  const gc = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tc = isDark ? '#8b949e' : '#718096';
  if (stressChart) stressChart.destroy();
  stressChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [{
        data: [2,3,4,3,5,2,3],
        borderColor: '#f97316',
        backgroundColor: 'rgba(249,115,22,0.1)',
        tension: 0.4, fill: true, pointRadius: 5,
        pointBackgroundColor: '#f97316'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min:0, max:10, grid:{color:gc}, ticks:{color:tc} },
        x: { grid:{color:gc}, ticks:{color:tc} }
      }
    }
  });
}

/* ============================================================
   SLEEP TRACKER
   ============================================================ */
function initSleepTracker() {
  const slider = document.getElementById('sleepDurationSlider');
  if (slider) {
    slider.addEventListener('input', function() {
      const v = parseInt(this.value);
      document.getElementById('sleepHours').textContent = v + 'h';
      const lbl = document.querySelector('.sleep-quality-lbl');
      if (lbl) lbl.textContent = v >= 7 && v <= 9 ? 'Good Sleep 😊' : v < 7 ? 'Short Sleep ⚠️' : 'Long Sleep 😴';
    });
  }
  document.querySelectorAll('.quality-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
  drawSleepChart();
}

function saveSleep() {
  const h = document.getElementById('sleepDurationSlider')?.value || 7;
  const q = document.querySelector('.quality-btn.selected')?.textContent?.trim() || '';
  store('sleep', { hours: h, quality: q, ts: Date.now() });
  showToast('✓ Sleep log saved!');
}

let sleepChart = null;
function drawSleepChart() {
  const ctx = document.getElementById('sleepChart');
  if (!ctx) return;
  const isDark = root.getAttribute('data-theme') === 'dark';
  const gc = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tc = isDark ? '#8b949e' : '#718096';
  if (sleepChart) sleepChart.destroy();
  sleepChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [{
        data: [7,6,8,7,6,9,7],
        backgroundColor: 'rgba(96,165,250,0.6)',
        borderColor: '#60a5fa',
        borderWidth: 1, borderRadius: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min:0, max:12, grid:{color:gc}, ticks:{color:tc} },
        x: { grid:{display:false}, ticks:{color:tc} }
      }
    }
  });
}

/* ============================================================
   BREATHING / RELAXATION
   ============================================================ */
let breathRunning = false;
let breathTimer = null;
let breathCountdown = null;
let breathCycles = 0;
let breathStep = 0;

const breathSequence = [
  { phase:'Inhale', num:4, instruction:'Breathe in slowly through your nose...', state:'expand', duration:4000 },
  { phase:'Hold',   num:4, instruction:'Hold your breath gently...',               state:'hold',   duration:4000 },
  { phase:'Exhale', num:6, instruction:'Breathe out slowly through your mouth...', state:'',       duration:6000 },
  { phase:'Rest',   num:2, instruction:'Rest and prepare for next cycle...',        state:'',       duration:2000 }
];

function toggleBreath() {
  breathRunning = !breathRunning;
  document.getElementById('breathBtn').textContent = breathRunning ? '⏸ Pause' : '▶ Resume';
  if (breathRunning) runBreath();
  else { clearTimeout(breathTimer); clearInterval(breathCountdown); }
}

function runBreath() {
  if (!breathRunning) return;
  const s = breathSequence[breathStep];
  document.getElementById('breathPhase').textContent       = s.phase;
  document.getElementById('breathNum').textContent         = s.num;
  document.getElementById('breathInstruction').textContent = s.instruction;
  document.getElementById('breathCircle').className        = 'breath-circle ' + s.state;

  let countVal = s.num;
  clearInterval(breathCountdown);
  breathCountdown = setInterval(() => {
    countVal--;
    if (countVal > 0) document.getElementById('breathNum').textContent = countVal;
  }, 1000);

  const prog = document.getElementById('breathProg');
  prog.style.transition = 'none'; prog.style.width = '0%';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    prog.style.transition = `width ${s.duration}ms linear`;
    prog.style.width = '100%';
  }));

  breathTimer = setTimeout(() => {
    breathStep = (breathStep + 1) % breathSequence.length;
    if (breathStep === 0) {
      breathCycles++;
      document.getElementById('cycleCount').textContent = breathCycles + ' cycle' + (breathCycles > 1 ? 's' : '');
    }
    runBreath();
  }, s.duration);
}

function resetBreath() {
  breathRunning = false;
  clearTimeout(breathTimer); clearInterval(breathCountdown);
  breathStep = 0; breathCycles = 0;
  document.getElementById('breathBtn').textContent         = '▶ Start';
  document.getElementById('breathPhase').textContent       = 'Inhale';
  document.getElementById('breathNum').textContent         = '4';
  document.getElementById('breathInstruction').textContent = 'Breathe in slowly through your nose...';
  document.getElementById('breathCircle').className        = 'breath-circle';
  document.getElementById('cycleCount').textContent        = '0 cycles';
  document.getElementById('breathProg').style.width        = '0%';
}

/* ============================================================
   ANALYTICS
   ============================================================ */
let analyticsLineChart = null;
let analyticsRadarChart = null;

function initAnalytics() {
  drawAnalyticsLine();
  drawAnalyticsRadar();
}

function drawAnalyticsLine() {
  const ctx = document.getElementById('analyticsChart');
  if (!ctx) return;
  const isDark = root.getAttribute('data-theme') === 'dark';
  const gc = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tc = isDark ? '#8b949e' : '#718096';
  if (analyticsLineChart) analyticsLineChart.destroy();
  analyticsLineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [
        { label:'Health', data:[60,65,70,68,72,75,70], borderColor:'#00d4c8', tension:0.4, pointRadius:3 },
        { label:'Mood',   data:[3,4,5,3,4,5,4],        borderColor:'#a855f7', tension:0.4, pointRadius:3 },
        { label:'Calm',   data:[7,6,7,8,5,8,7],        borderColor:'#60a5fa', tension:0.4, pointRadius:3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color:tc, boxWidth:12, font:{size:11} } } },
      scales: {
        y: { grid:{color:gc}, ticks:{color:tc} },
        x: { grid:{color:gc}, ticks:{color:tc} }
      }
    }
  });
}

function drawAnalyticsRadar() {
  const ctx = document.getElementById('radarChart');
  if (!ctx) return;
  const isDark = root.getAttribute('data-theme') === 'dark';
  const tc = isDark ? '#8b949e' : '#718096';
  const gc = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  if (analyticsRadarChart) analyticsRadarChart.destroy();
  analyticsRadarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Health','Mood','Activity','Calm','Sleep'],
      datasets: [{
        data: [70,65,50,75,80],
        borderColor: '#00d4c8',
        backgroundColor: 'rgba(0,212,200,0.15)',
        pointBackgroundColor: '#00d4c8'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          grid: { color: gc },
          ticks: { color: tc, backdropColor:'transparent', display:false },
          pointLabels: { color: tc, font:{size:11} },
          min: 0, max: 100
        }
      }
    }
  });
}

/* ============================================================
   JOURNAL
   ============================================================ */
let journalEntries = [];

const journalPrompts = [
  "What's one thing you're grateful for today?",
  "Describe a moment today that made you smile.",
  "What is one challenge you overcame recently?",
  "What are three words that describe your current feelings?",
  "What do you need more of in your life right now?"
];

function initJournal() {
  journalEntries = retrieve('journalEntries', []);
  renderJournalList();
}

function setJournalPrompt() {
  const p = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
  const body = document.getElementById('journalBody');
  if (body) { body.placeholder = p; body.focus(); }
}

function selectJournalMood(el) {
  document.querySelectorAll('#journalMoods span').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}

function saveJournal() {
  const body  = document.getElementById('journalBody')?.value.trim();
  if (!body) { showToast('⚠ Please write something first'); return; }
  const title = document.getElementById('journalTitle')?.value.trim() || 'Untitled Entry';
  const mood  = document.querySelector('#journalMoods span.active')?.textContent || '';
  journalEntries.unshift({
    title, body, mood,
    date: new Date().toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'})
  });
  store('journalEntries', journalEntries);
  document.getElementById('journalTitle').value = '';
  document.getElementById('journalBody').value  = '';
  document.querySelectorAll('#journalMoods span').forEach(s => s.classList.remove('active'));
  renderJournalList();
  showToast('✓ Journal entry saved!');
}

function renderJournalList() {
  const list = document.getElementById('journalList');
  if (!list) return;
  if (!journalEntries.length) {
    list.innerHTML = `
      <div class="journal-empty">
        <div class="journal-empty-icon">📖</div>
        <div class="journal-empty-text">No entries yet<br>Write your first journal entry above</div>
      </div>`;
    return;
  }
  list.innerHTML = journalEntries.map(e => `
    <div class="journal-entry">
      <div class="journal-entry-header">
        <span style="font-size:1.2rem;">${e.mood}</span>
        <div>
          <div class="journal-entry-title">${e.title}</div>
          <div class="journal-entry-date">${e.date}</div>
        </div>
      </div>
      <div class="journal-entry-body">${e.body}</div>
    </div>`).join('');
}

/* ============================================================
   PROFILE
   ============================================================ */
let selectedAvatar = '😊';

function initProfile() {
  const saved = retrieve('profile', {});
  if (saved.name)   { document.getElementById('profileName').value  = saved.name;  document.getElementById('profileHeroName').textContent = saved.name; }
  if (saved.age)    document.getElementById('profileAge').value     = saved.age;
  if (saved.email)  document.getElementById('profileEmail').value   = saved.email;
  if (saved.goal)   document.getElementById('profileGoal').value    = saved.goal;
  if (saved.avatar) {
    selectedAvatar = saved.avatar;
    document.getElementById('profileAvatarBig').textContent = saved.avatar;
    document.querySelectorAll('.avatar-opt').forEach(a => {
      a.classList.toggle('selected', a.textContent.trim() === saved.avatar);
    });
  }
}

function selectAvatar(el, emoji) {
  document.querySelectorAll('.avatar-opt').forEach(a => a.classList.remove('selected'));
  el.classList.add('selected');
  selectedAvatar = emoji;
  const big = document.getElementById('profileAvatarBig');
  if (big) big.textContent = emoji;
}

function saveProfile() {
  const name = document.getElementById('profileName')?.value.trim() || 'Your Name';
  document.getElementById('profileHeroName').textContent = name;
  document.getElementById('profileAvatarBig').textContent = selectedAvatar;
  store('profile', {
    name,
    age:    document.getElementById('profileAge')?.value,
    email:  document.getElementById('profileEmail')?.value,
    goal:   document.getElementById('profileGoal')?.value,
    avatar: selectedAvatar
  });
  showToast('✓ Profile saved!');
}
