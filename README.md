# CARE.IO — Mental Wellness App

A fully client-side mental wellness dashboard with dark/light mode, 10 pages, and localStorage persistence.

## 📁 Project Structure

```
careio/
│
├── index.html              ← Main shell (sidebar + iframe router)
├── css/
│   └── style.css           ← All styles + CSS variables (dark & light themes)
├── js/
│   └── app.js              ← All JavaScript logic (nav, charts, forms, storage)
├── pages/
│   ├── home.html           ← Dashboard with live stats
│   ├── health.html         ← Health score with donut chart + sliders
│   ├── mood.html           ← Mood selector + weekly line chart
│   ├── stress.html         ← Stress slider + symptoms + chart
│   ├── sleep.html          ← Sleep duration + quality + bar chart
│   ├── relaxation.html     ← Animated breathing exercise + meditation cards
│   ├── analytics.html      ← Line chart + radar chart + insights
│   ├── journal.html        ← Private journal with localStorage
│   ├── emergency.html      ← Helplines (India, US, UK) + resources
│   └── profile.html        ← User profile, avatar, progress, streak
└── assets/
    └── icons/              ← (Add custom icons/images here)
```

## 🚀 How to Run

Simply open `index.html` in any modern browser — **no server or build step required**.

> **Recommended:** Use a local server for best iframe + localStorage behavior:
> ```bash
> # Python 3
> cd careio
> python -m http.server 8080
> # Visit: http://localhost:8080
> ```
> Or use the **Live Server** extension in VS Code (right-click index.html → Open with Live Server).

## ✨ Features

- 🌙 Dark / ☀️ Light mode toggle (persisted in localStorage)
- 📊 Interactive Chart.js charts — line, bar, donut, radar
- 💾 All data saved to localStorage (health, mood, stress, sleep, journal, profile)
- 🧘 Animated 4-4-6-2 breathing exercise with live countdown
- 📖 Journal with prompt suggestions and mood tagging
- 🆘 Emergency helplines with real tel: links (India, US, UK)
- 👤 Profile with avatar picker and progress tracker

## 🛠 Tech Stack

- Vanilla HTML / CSS / JavaScript (zero frameworks)
- Chart.js 4.4 via CDN
- Google Fonts — DM Sans + DM Serif Display

## 🎨 Customize

Edit CSS variables in `css/style.css` under `[data-theme="dark"]` and `[data-theme="light"]` to change any color instantly across the whole app.
