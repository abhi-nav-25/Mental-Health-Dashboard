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
  const lastPage = 'home';
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
  updateRecommendations(score);
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

function getRecommendations(score) {
  const recs = [];

  const sleep = parseInt(document.getElementById('sl1')?.value || 7);
  const activity = parseInt(document.getElementById('sl2')?.value || 7);
  const nutrition = parseInt(document.getElementById('sl3')?.value || 7);
  const social = parseInt(document.getElementById('sl4')?.value || 7);

  // 🔴 Overall score based
  if (score < 40) {
    recs.push(" Your health score is LOW. Focus on small improvements in daily habits.");
  } else if (score < 60) {
    recs.push(" You're doing OKAY, but there's room for improvement.");
  } else if (score < 80) {
    recs.push(" GOOD JOB! Maintain consistency to improve further.");
  } else {
    recs.push(" EXCELLENT! Keep up your healthy lifestyle.");
  }

  // 🧩 Factor-specific tips
  if (sleep < 5) {
    recs.push(" Improve sleep: aim for 7–8 hours and fix your sleep schedule.");
  }

  if (activity < 5) {
    recs.push(" Increase activity: even 20–30 mins walk helps a lot.");
  }

  if (nutrition < 5) {
    recs.push(" Focus on balanced meals: add fruits, protein, and hydration.");
  }

  if (social < 5) {
    recs.push(" Connect with friends/family — social health matters too.");
  }

  // 🟡 Medium suggestions (5–7 range)
  if (sleep >= 5 && sleep < 7) {
    recs.push(" Try improving sleep quality (less screen time before bed).");
  }

  if (activity >= 5 && activity < 7) {
    recs.push(" Try adding light exercise to boost your energy.");
  }

  return recs;
}

function updateRecommendations(score) {
  const list = document.getElementById('recommendationList');
  if (!list) return;

  const recs = getRecommendations(score);

list.innerHTML = `
  <ul class="insights-list">
    ${recs.map(r => `<li>✦${r}</li>`).join('')}
  </ul>
`;}

/* ============================================================
   MOOD TRACKER
   ============================================================ */
   let moodHistory = retrieve("mood-history", []);  // stores last 7 moods
let selectedMoodIndex = null; // for editing on click

const moodLevels = {
  "Happy": 5,
  "Content": 4,
  "Neutral": 3,
  "Sad": 2,
  "Distressed": 2,
  "Angry": 1,
  "Anxious": 1,
  "Tired": 2
};
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

  const moodName = selected.dataset.mood;
  const score = moodLevels[moodName];
  const note = document.getElementById("moodNote").value;

  if (selectedMoodIndex !== null) {
    // update existing day
    moodHistory[selectedMoodIndex] = { mood: moodName, score, note };
    selectedMoodIndex = null;
  } else {
    // push new day
    moodHistory.push({ mood: moodName, score, note });
    moodHistory = moodHistory.slice(-7);
  }

  store("mood-history", moodHistory);
  showToast(`✓ Mood "${moodName}" saved!`);
  drawMoodChart();
}
let moodChart = null;

function drawMoodChart() {
  const ctx = document.getElementById('moodChart');
  if (!ctx) return;

  const isDark = root.getAttribute('data-theme') === 'dark';
  const gc = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tc = isDark ? '#8b949e' : '#718096';

  const quotes = [
    "Keep going—you’re doing great.",
    "Every day counts.",
    "Your feelings matter.",
    "You’re stronger than you think.",
    "Be kind to yourself.",
    "Small progress is still progress.",
    "You are growing.",
    "Breathe. You got this."
  ];

  const scores = moodHistory.map(e => e.score);

  // ✔ FIX: Correct weekday order
  const fullWeek = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const labels = fullWeek.slice(0, scores.length);

  if (moodChart) moodChart.destroy();

  moodChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: scores,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168,85,247,0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: '#a855f7'
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
              const q = quotes[Math.floor(Math.random()*quotes.length)];
              const moodName = moodHistory[ctx.dataIndex].mood;
              return `${moodName} (${ctx.raw}/5)\n${q}`;
            }
          }
        }
      },

      onClick: (evt) => {
        const pts = moodChart.getElementsAtEventForMode(
          evt,
          "nearest",
          { intersect: true },
          true
        );
        if (!pts.length) return;

        const index = pts[0].index;
        selectedMoodIndex = index;

        const entry = moodHistory[index];

        document.querySelectorAll('.mood-btn').forEach(b => {
          b.classList.remove('selected');
          if (b.dataset.mood === entry.mood) b.classList.add('selected');
        });

        document.getElementById("moodNote").value = entry.note || "";

        showToast("Editing selected day's mood...");
      },

      scales: {
        y: { min: 1, max: 5, grid:{color:gc}, ticks:{color:tc} },
        x: { grid:{color:gc}, ticks:{color:tc} }
      }
    }
  });
}

/* ============================================================
   STRESS MONITOR
   ============================================================ */
/* ============================================================
   STRESS MONITOR  — UPDATED FOR DYNAMIC GRAPH
   ============================================================ */
   let selectedDayIndex = null;

const stressData = {
  emojis:  ['','😌','😊','😕','😐','😟','😧','😰','😱','😤','🤯'],
  labels:  ['','Very Calm','Calm','Mild','Moderate','Stressed','Tense','Anxious','Very Anxious','Severe','Extreme'],
  colors:  ['','#4ade80','#4ade80','#86efac','#facc15','#fb923c','#f97316','#ef4444','#dc2626','#b91c1c','#7f1d1d']
};

// Load or initialize stress history
let stressHistory = retrieve("stress-history", []);

// Initialize
function initStressMonitor() {
  const slider = document.getElementById("stressSlider");
  if (slider) {
    slider.addEventListener("input", () =>
      updateStressDisplay(parseInt(slider.value))
    );
    updateStressDisplay(parseInt(slider.value));
  }

  drawStressChart();
}

// Update emoji label + score display
function updateStressDisplay(v) {
  const emoji = document.getElementById("stressEmoji");
  const label = document.getElementById("stressLabelText");
  const score = document.getElementById("stressScore");

  if (emoji) emoji.textContent = stressData.emojis[v];
  if (label) {
    label.textContent = stressData.labels[v];
    label.style.color = stressData.colors[v];
  }
  if (score) {
    score.textContent = `● ${v}/10`;
    score.style.color = stressData.colors[v];
    score.style.background = stressData.colors[v] + "22";
  }
}

function toggleSymptom(el) {
  el.classList.toggle("active");
}

// Save stress: new or edit existing day
function saveStress() {
  const v = parseInt(document.getElementById("stressSlider")?.value || 3);

  if (selectedDayIndex !== null) {
    // Update selected day's stress
    stressHistory[selectedDayIndex].level = v;
    selectedDayIndex = null;
  } else {
    // Normal: Add new day entry
    const activeSym = [...document.querySelectorAll(".symptom-tag.active")].map(
      (t) => t.textContent
    );

    const entry = { level: v, symptoms: activeSym, ts: Date.now() };

    stressHistory.push(entry);
    stressHistory = stressHistory.slice(-7); // Keep last 7 days
  }

  store("stress-history", stressHistory);
  showToast("✓ Stress updated!");

  drawStressChart();
}

let stressChart = null;

// Draw stress chart
function drawStressChart() {
  const ctx = document.getElementById("stressChart");
  if (!ctx) return;

  const isDark = root.getAttribute("data-theme") === "dark";
  const gc = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
  const tc = isDark ? "#8b949e" : "#718096";

  const motivationalQuotes = [
    "You're doing better than you think.",
    "Small steps count.",
    "You are stronger than yesterday.",
    "Be kind to yourself.",
    "Progress is progress!",
    "Breathe. You got this.",
    "Take it one day at a time.",
    "Your feelings are valid.",
    "You are not alone.",
    "Keep going — proud of you."
  ];

  const values = stressHistory.map((e) => parseInt(e.level));
  const plotData = values.length ? values : [0];

  // FIXED WEEKDAY ORDER (ALWAYS START FROM MONDAY)
  const fullWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const labels = fullWeek.slice(0, plotData.length);

  if (stressChart) stressChart.destroy();

  stressChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          data: plotData,
          borderColor: "#f97316",
          backgroundColor: "rgba(249,115,22,0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "#f97316"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
  const level = ctx.raw;

  if (level <= 3) {
    return `Stress: ${level}/10\nFeeling calm — great job!`;
  } 
  else if (level <= 5) {
    return `Stress: ${level}/10\nYou're doing okay — keep it up.`;
  } 
  else if (level <= 7) {
    return `Stress: ${level}/10\nYou're getting stressed — take a short break.`;
  } 
  else if (level <= 9) {
    return `Stress: ${level}/10\nHigh stress! Please slow down and rest.`;
  } 
  else {
    return `Stress: ${level}/10\n⚠️ Extremely stressed — take a break immediately.`;
  }
}
          }
        }
      },

      onClick: (event) => {
        const points = stressChart.getElementsAtEventForMode(
          event,
          "nearest",
          { intersect: true },
          true
        );

        if (!points.length) return;

        const index = points[0].index;
        selectedDayIndex = index;

        const slider = document.getElementById("stressSlider");
        slider.value = stressHistory[index].level;

        updateStressDisplay(stressHistory[index].level);

        showToast("Editing selected day's stress score...");
      },

      scales: {
        y: { min: 0, max: 10, grid: { color: gc }, ticks: { color: tc } },
        x: { grid: { color: gc }, ticks: { color: tc } }
      }
    }
  });
}

/* ============================================================
   SLEEP TRACKER
   ============================================================ */
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

function deleteJournal(index) {
  journalEntries.splice(index, 1);

  // ✅ use same storage method
  store('journalEntries', journalEntries);

  renderJournalList();
  showToast("Entry deleted 🗑");
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
  list.innerHTML = journalEntries.map((e, i) => `
    <div class="journal-entry">
      <div class="journal-entry-header">
        <span style="font-size:1.2rem;">${e.mood}</span>
        <div style="flex:1;">
          <div class="journal-entry-title">${e.title}</div>
          <div class="journal-entry-date">${e.date}</div>
        </div>
        <button class="journal-delete-btn" onclick="deleteJournal(${i})">❌</button>
        </div>
      <div class="journal-entry-body">${e.body}</div>
    </div>
  `).join('');
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

/* ============================================================
   RELAXATION
   ============================================================ */
let breathRunning = false;

let breathTimer = null;
let breathCountdown = null;
let progressInterval = null;

let breathCycles = 0;
let breathStep = 0;

let countVal = 0;

// progress tracking
let progressStartTime = 0;
let progressElapsed = 0;
let currentDuration = 0;

const breathSequence = [
  { phase:'Inhale', num:4, instruction:'Breathe in slowly through your nose...', duration:4000 },
  { phase:'Hold',   num:4, instruction:'Hold your breath gently...',               duration:4000 },
  { phase:'Exhale', num:6, instruction:'Breathe out slowly through your mouth...', duration:6000 },
  { phase:'Rest',   num:2, instruction:'Rest and prepare for next cycle...',        duration:2000 }
];

function toggleBreath() {
  const btn = document.getElementById('breathBtn');
  const circle = document.getElementById('breathCircle');

  if (!breathRunning) {
    // ▶ START / RESUME
    breathRunning = true;
    btn.textContent = '⏸ Pause';

    circle.style.animationPlayState = 'running';

    // resume timers correctly
    progressStartTime = Date.now() - progressElapsed;

    startIntervals();

  } else {
    // ⏸ PAUSE
    breathRunning = false;
    btn.textContent = '▶ Resume';

    circle.style.animationPlayState = 'paused';

    clearTimeout(breathTimer);
    clearInterval(breathCountdown);
    clearInterval(progressInterval);
  }
}

function startIntervals() {
  const s = breathSequence[breathStep];

  // only reset UI if fresh start (not resume)
  if (progressElapsed === 0) {
    document.getElementById('breathPhase').textContent = s.phase;
    document.getElementById('breathNum').textContent = s.num;
    document.getElementById('breathInstruction').textContent = s.instruction;

    countVal = s.num;
    currentDuration = s.duration;
    progressStartTime = Date.now();
  }

  // countdown
  clearInterval(breathCountdown);
  breathCountdown = setInterval(() => {
    countVal--;
    if (countVal > 0) {
      document.getElementById('breathNum').textContent = countVal;
    }
  }, 1000);

  // progress bar
  const prog = document.getElementById('breathProg');

  clearInterval(progressInterval);
  progressInterval = setInterval(() => {
    const now = Date.now();
    progressElapsed = now - progressStartTime;

    let percent = (progressElapsed / currentDuration) * 100;
    if (percent >= 100) percent = 100;

    prog.style.width = percent + "%";
  }, 16);

  // next phase timer
  breathTimer = setTimeout(() => {
    progressElapsed = 0;

    breathStep = (breathStep + 1) % breathSequence.length;

    if (breathStep === 0) {
      breathCycles++;
      document.getElementById('cycleCount').textContent =
        breathCycles + ' cycle' + (breathCycles > 1 ? 's' : '');
    }

    startIntervals();
  }, currentDuration - progressElapsed);
}

function resetBreath() {
  const circle = document.getElementById('breathCircle');

  clearTimeout(breathTimer);
  clearInterval(breathCountdown);
  clearInterval(progressInterval);

  breathRunning = false;
  breathStep = 0;
  breathCycles = 0;

  countVal = 0;
  progressElapsed = 0;

  document.getElementById('breathPhase').textContent = 'Inhale';
  document.getElementById('breathNum').textContent = '4';
  document.getElementById('breathInstruction').textContent = 'Breathe in slowly through your nose...';
  document.getElementById('cycleCount').textContent = '0 cycles';
  document.getElementById('breathProg').style.width = '0%';
  document.getElementById('breathBtn').textContent = '▶ Start';

  circle.style.animationPlayState = 'paused';
  circle.style.transform = 'scale(1)';
}

function logMeditation() {
  const last = retrieve('lastMeditationTime', 0);
  const now = Date.now();

  // only allow once every 1 min
  if (now - last < 60000) return;

  let sessions = retrieve('meditationSessions', 0);
  sessions++;

  store('meditationSessions', sessions);
  store('lastMeditationTime', now);

  showToast?.("🧘 Session added!");
}