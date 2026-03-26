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
/* ================= STORAGE HELPERS ================= */

function store(key, value) {
  localStorage.setItem('careio-' + key, JSON.stringify(value));
}

function retrieve(key, fallback = []) {
  try {
    const v = localStorage.getItem('careio-' + key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
}

/* ================= TOAST ================= */

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;

  t.textContent = msg;
  t.classList.add('show');

  setTimeout(() => t.classList.remove('show'), 2000);
}

/* ================= GLOBAL ================= */

let editingSleepDate = null;
let sleepChart = null;

/* ================= TIP ================= */

function updateSleepTip(hours) {
  const tip = document.getElementById('sleepTip');
  if (!tip) return;

  if (hours >= 7 && hours <= 9) {
    tip.textContent = "Great job! You slept well today 🌟";
  } 
  else if (hours < 7) {
    tip.textContent = "Sleep wasn’t enough today — try going to bed earlier 🌙";
  } 
  else {
    tip.textContent = "You slept longer — hope you feel refreshed 😴";
  }
}

/* ================= TIME → HOURS ================= */

function calculateSleepHours(bedtime, wakeup) {
  if (!bedtime || !wakeup) return null;

  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeup.split(':').map(Number);

  const bedMinutes  = bh * 60 + bm;
  const wakeMinutes = wh * 60 + wm;

  let diff = wakeMinutes - bedMinutes;

  if (diff < 0) diff += 24 * 60;

  return Math.round(diff / 60);
}

/* ================= INIT TIME LISTENERS ================= */

function initTimeInputs() {
  const timeInputs = document.querySelectorAll('input[type="time"]');

  if (timeInputs.length < 2) return;

  const bedtimeInput = timeInputs[0];
  const wakeupInput  = timeInputs[1];

  function updateFromTime() {
    const bedtime = bedtimeInput.value;
    const wakeup  = wakeupInput.value;

    const hours = calculateSleepHours(bedtime, wakeup);

    if (hours !== null) {
      const slider = document.getElementById('sleepDurationSlider');

      // 🔥 FORCE OVERRIDE slider
      slider.value = hours;

      document.getElementById('sleepHours').textContent = hours + 'h';

      updateSleepTip(hours);
    }
  }

  bedtimeInput.addEventListener('change', updateFromTime);
  wakeupInput.addEventListener('change', updateFromTime);
}

/* ================= SAVE ================= */

function saveSleep() {
  const dateToSave =
    editingSleepDate || new Date().toISOString().split('T')[0];

  const hours = parseInt(
    document.getElementById('sleepDurationSlider').value
  );

  const timeInputs = document.querySelectorAll('input[type="time"]');
  const bedtime = timeInputs[0]?.value || "";
  const wakeup  = timeInputs[1]?.value || "";

  let history = retrieve('sleepHistory', []);

  history = history.filter(e => e.date !== dateToSave);

  history.push({
    date: dateToSave,
    hours,
    bedtime,
    wakeup
  });

  store('sleepHistory', history);
  store('sleep', { hours, bedtime, wakeup });

  editingSleepDate = null;

  updateSleepTip(hours);
  showToast('✓ Sleep saved!');

  drawSleepChart();
}

/* ================= GRAPH ================= */

function drawSleepChart() {
  const ctx = document.getElementById('sleepChart');
  if (!ctx) return;

  let history = retrieve('sleepHistory', []);

  // 🔥 ensure full week with dummy data
  if (history.length < 7) {
    const today = new Date();
    const fullWeek = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);

      const dateStr = d.toISOString().split('T')[0];
      const existing = history.find(e => e.date === dateStr);

      fullWeek.push(
        existing || {
          date: dateStr,
          hours: Math.floor(Math.random() * 4) + 6,
          bedtime: "23:00",
          wakeup: "07:00"
        }
      );
    }

    history = fullWeek;
  }

  history.sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = history.map(e =>
    new Date(e.date).toLocaleDateString('en-US', {
      weekday: 'short'
    })
  );

  const data = history.map(e => e.hours);

  if (sleepChart) sleepChart.destroy();

  sleepChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: 'rgba(96,165,250,0.6)',
        borderColor: '#60a5fa',
        borderWidth: 1,
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const entry = history[ctx.dataIndex];

              let text = ctx.raw + ' hrs sleep';

              if (entry.bedtime && entry.wakeup) {
                text += ' | ' + entry.bedtime + ' → ' + entry.wakeup;
              }

              return text;
            }
          }
        }
      },

      scales: {
        y: {
          min: 0,
          max: 12,
          ticks: { stepSize: 2 }
        },
        x: {
          grid: { display: false }
        }
      },

      onClick: (evt, elements) => {
        if (!elements.length) return;

        const index = elements[0].index;
        const entry = history[index];

        editSleepEntry(entry);
      }
    }
  });
}

/* ================= EDIT ================= */

function editSleepEntry(entry) {
  editingSleepDate = entry.date;

  document.getElementById('sleepDurationSlider').value = entry.hours;
  document.getElementById('sleepHours').textContent = entry.hours + 'h';

  const timeInputs = document.querySelectorAll('input[type="time"]');
  if (entry.bedtime) timeInputs[0].value = entry.bedtime;
  if (entry.wakeup)  timeInputs[1].value = entry.wakeup;

  updateSleepTip(entry.hours);

  showToast("Editing " + entry.date);
}

/* ================= INIT ================= */

function initSleepTracker() {
  initTimeInputs();
  drawSleepChart();
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
