# 🧠 CARE.IO — Mental Wellness Dashboard

CARE.IO is a fully client-side mental wellness dashboard designed to help users track, reflect, and improve their emotional and physical well-being — while keeping all data **private and stored locally**.

---

## 🌟 Overview

CARE.IO provides a simple and engaging way to:

* Track daily mental and physical health
* Reflect through journaling
* Practice relaxation techniques
* Visualize personal wellness trends

No accounts, no backend — just a **fast, private, and accessible experience**.

---

## 🚀 Features

### 🏠 Dashboard (Home)

* Overview of health score, mood, sleep, and stress
* Daily inspiration quotes
* Quick activity insights

---

### 💛 Health Score System

* Multi-factor wellness scoring:

  * Sleep
  * Physical activity
  * Nutrition
  * Social connection
* Donut chart visualization
* Smart recommendations based on inputs

---

### 😊 Mood Tracker

* Emoji-based mood logging
* Historical tracking
* Weekly trend visualization

---

### 📈 Stress Monitor

* Adjustable stress levels
* Symptom tracking
* Visual feedback

---

### 🌙 Sleep Tracker

* Track sleep hours and quality
* Integrated into overall health score

---

### 🧘 Relaxation Hub

* 4-4-6-2 breathing exercise:

  * Animated breathing guide
  * Countdown timer
  * Pause / Resume / Reset
* Meditation session tracking
* Quick calming activities

---

### 📊 Analytics Dashboard

* Weekly trends (line chart)
* Wellness radar chart
* Insight generation

---

### 📖 Journal System

* Private journaling (stored locally)
* Mood tagging
* Prompt suggestions
* Entry management (add/delete)

---

### 👤 Profile & Progress

* Avatar selection
* Wellness goals
* Progress tracking:

  * Health score
  * Journal entries
  * Meditation sessions
  * Sleep hours

---

### 🆘 Emergency Support

* Helplines (India, US, UK)
* Quick access via phone links

---

## 📁 Project Structure

```id="proj123"
careio/
│
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── pages/
│   ├── home.html
│   ├── health.html
│   ├── mood.html
│   ├── stress.html
│   ├── sleep.html
│   ├── relaxation.html
│   ├── analytics.html
│   ├── journal.html
│   ├── emergency.html
│   └── profile.html
└── assets/
```

---

## 🧠 Data Storage

All data is stored using **localStorage**:

* `careio-healthScore`
* `careio-journalEntries`
* `careio-mood-history`
* `careio-stress-history`
* `careio-sleep`
* `careio-meditationSessions`

No external servers are used — ensuring complete privacy.

---

## 🎨 UI/UX Highlights

* Dark / Light mode (persistent)
* Responsive layout
* Smooth animations
* Clean and minimal interface

---

## 🛠 Tech Stack

* HTML, CSS, JavaScript (Vanilla)
* Chart.js (CDN)
* localStorage
* Google Fonts (DM Sans)

---

## 🚀 How to Run

Open `index.html` directly
OR run:

```id="run123"
python -m http.server 8080
```

---

## 👨‍💻 Authors

* **Abhinav Sharma**
* **Nandani**

---

## 💡 Tagline

*Track your mind. Improve your life — privately.*
