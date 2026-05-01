<p align="center">
  <img src="https://img.shields.io/badge/MatruSakhi-मातृसखी-e85d75?style=for-the-badge&labelColor=1a1025" alt="MatruSakhi"/>
</p>

<h1 align="center">🤰 MatruSakhi — AI-Powered Maternal Health Companion</h1>

<p align="center">
  <em>Empowering expectant and new mothers with AI-driven health insights, personalized care, and emergency support.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.12+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" />
</p>

---

## 📖 About

**MatruSakhi** (मातृसखी — *Mother's Companion*) is a full-stack AI-powered web application designed to support expectant and new mothers throughout their pregnancy journey. Built with Indian healthcare standards (WHO/ICMR guidelines), it offers personalized health tracking, AI-driven chatbot assistance, medical report analysis, emergency SOS alerts, and a rich library of culturally relevant educational content.

> 🏥 **Disclaimer:** MatruSakhi is an educational and informational tool. It is NOT a replacement for professional medical advice. Always consult your healthcare provider for medical decisions.

---

## ✨ Features

### 🔐 Authentication & Security
- Secure registration with email verification (SMTP)
- JWT-based authentication (access + refresh tokens)
- bcrypt password hashing (12 rounds)
- Auto token refresh on expiry
- Role-based access control (Mother, ASHA worker, Doctor, Admin)

### 🤖 AI Health Chatbot
- Context-aware AI responses using **Groq (Llama 3.1)** or **OpenAI (GPT-4o-mini)**
- Personalized based on pregnancy week, age, and blood group
- WHO/ICMR guideline-compliant health advice
- Automatic danger sign detection in conversations
- Intelligent rule-based fallback when AI keys are not configured
- Conversation history management

### ❤️ Health Tracking
- **Vitals:** Blood pressure, weight, temperature logging
- **Mood:** Emotional state tracking with visual indicators
- **Symptoms:** Pregnancy symptom logger with automatic danger sign detection
- **Approx. Kick Counter:** Daily fetal movement tracking
- **Milestones:** 11 pre-defined pregnancy milestones (Week 4–40) with toggle completion
- **Dashboard:** At-a-glance health summary with progress indicators

### 📋 Medical Report Analysis
- Upload medical reports (PDF or image)
- **PDF text extraction** via PyPDF2
- **Image OCR** via Tesseract (optional)
- **AI-powered analysis** that provides:
  - Plain-language summary of report findings
  - Key medical values with normal/low/high status
  - Risk flags for concerning values
  - Personalized diet suggestions
  - Recommended next steps
- Auto-extraction of blood group to user profile
- Keyword-based fallback analysis when AI is unavailable

### 🆘 SOS Emergency Alert System
- **3 severity levels** with intuitive gesture triggers:

  | Level | Trigger | Actions |
  |-------|---------|---------|
  | 🟡 Need Help | Single tap | SMS to emergency contacts |
  | 🟠 Urgent | Press & hold (3s) | Priority SMS alerts |
  | 🔴 Emergency | Triple tap / Hold (5s) | SMS + Voice call + Siren alarm |

- GPS location sharing via Google Maps link
- Twilio-powered SMS and automated voice calls
- Resolve (safe) / Cancel (false alarm) with contact notifications
- Direct dial buttons for emergency contacts
- Floating SOS button accessible on every page

### 📚 Educational Resources (27+ Articles)
- **15 categories** covering the complete pregnancy journey:
  - 🙏 Garbhasanskar & Spiritual Practices
  - ✅ Dos & Don'ts During Pregnancy
  - 🥗 Nutrition & Indian Diet Plans
  - 🏃 Exercise & Prenatal Yoga
  - 💉 Vaccination Awareness
  - 🤰 Body Changes & Discomfort Management
  - 👗 Clothing Tips (including Indian wear)
  - 🧠 Mental Health & Emotional Wellness
  - 👶 Week-by-Week Baby Development
  - 🩺 Prenatal Care & Checkup Schedule
  - 🏥 Labor & Delivery Preparation
  - 🤱 Postpartum Recovery
  - 🍼 Breastfeeding Basics
  - 🚨 Danger Signs
- **Personalized recommendation engine** based on pregnancy week and popularity
- Like, view, and search functionality

### 📅 Appointment Management
- Create, edit, and track prenatal appointments
- Filter by status (Scheduled, Completed, Cancelled)
- Provider and location tracking

### 🔔 Smart Health Alerts
- Automatic detection of **11 pregnancy danger signs**
- Severity-based alerts (Critical 🔴, Warning 🟡, Info 🔵)
- Actionable recommendations for each danger sign
- Mark as read / dismiss functionality
- Emergency numbers (Ambulance 108, Women's Helpline 181)

### 🎛️ Intuitive UI/UX
- Premium dark theme with glassmorphism design
- Responsive layout (desktop + mobile)
- Reusable dropdown menus across the platform
- Color-coded categories and badges
- Smooth animations and micro-interactions

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│              Frontend (Next.js 16)               │
│         React + TypeScript + Zustand             │
│              http://localhost:3000                │
└─────────────────────┬────────────────────────────┘
                      │ REST API (JWT Bearer)
                      ▼
┌──────────────────────────────────────────────────┐
│              Backend (FastAPI)                    │
│     Routes → Middleware → Services → Models      │
│              http://localhost:8000                │
└──────┬──────────────┬──────────────┬─────────────┘
       │              │              │
       ▼              ▼              ▼
  ┌─────────┐  ┌───────────┐  ┌───────────┐
  │ MongoDB │  │ Groq /    │  │ Twilio    │
  │         │  │ OpenAI    │  │ (SMS/Call)│
  │ 9 colls │  │ (AI)      │  │ + SMTP   │
  └─────────┘  └───────────┘  └───────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Vanilla CSS with custom design system |
| **State** | Zustand |
| **HTTP** | Axios (with JWT interceptor) |
| **Backend** | FastAPI (Python 3.12+) |
| **Database** | MongoDB + Motor (async driver) |
| **Auth** | JWT (python-jose) + bcrypt |
| **AI** | Groq (Llama 3.1 8B) / OpenAI (GPT-4o-mini) |
| **SMS/Voice** | Twilio |
| **Email** | SMTP (Gmail / Outlook) |
| **PDF Parsing** | PyPDF2 |
| **OCR** | Tesseract (optional) |

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.12 or higher
- **Node.js** 18 or higher
- **MongoDB** running on `localhost:27017`
- (Optional) Groq/OpenAI API key for AI features
- (Optional) Twilio account for SOS SMS/voice calls
- (Optional) Gmail App Password for email verification

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/Matru-Sakhi.git
cd Matru-Sakhi
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\activate
# Activate (macOS/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys and settings
```

### 3. Frontend Setup

```bash
cd client

# Install dependencies
npm install
```

### 4. Configure Environment Variables

**Backend** (`backend/.env`):
```env
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=matrusakhi
SECRET_KEY=your-secret-key-here

# AI (at least one for chat & report analysis)
GROQ_API_KEY=gsk_your_key_here
OPENAI_API_KEY=sk-your_key_here

# Email Verification (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# SOS Alerts (optional)
TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Frontend** (`client/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5. Run the Application

```bash
# Terminal 1 — Backend
cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend
cd client
npx next dev --port 3000
```

### 6. Access

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:3000 |
| ⚡ Backend API | http://localhost:8000 |
| 📖 API Docs (Swagger) | http://localhost:8000/docs |

---

## 📂 Project Structure

```
Matru-Sakhi/
├── backend/                          # FastAPI Backend
│   ├── app/
│   │   ├── main.py                   # App entry point
│   │   ├── api/routes/               # API endpoints (8 modules)
│   │   ├── api/middleware/            # JWT auth middleware
│   │   ├── core/                     # Config & security
│   │   ├── db/                       # MongoDB connection
│   │   ├── models/                   # Document structures
│   │   ├── schemas/                  # Pydantic validation
│   │   └── services/                 # Business logic (10 services)
│   ├── uploads/                      # Uploaded medical reports
│   └── .env                          # Backend config
│
├── client/                           # Next.js Frontend
│   └── src/
│       ├── app/(auth)/               # Login, Register, Verify
│       ├── app/(protected)/          # All authenticated pages
│       ├── components/               # Reusable UI components
│       ├── lib/api.ts                # Axios HTTP client
│       └── stores/authStore.ts       # Zustand auth state
│
├── MATRUSAKHI_COMPLETE_DOCUMENTATION.md  # Full technical docs
└── README.md                         # This file
```

---

## 🔌 API Overview

| Module | Prefix | Endpoints | Description |
|--------|--------|-----------|-------------|
| **Auth** | `/api/auth` | 8 | Register, login, profile, verify email |
| **Chat** | `/api/chat` | 4 | AI chatbot conversations |
| **Health** | `/api/health` | 9 | Records, milestones, dashboard, symptom check |
| **Appointments** | `/api/appointments` | 5 | CRUD for prenatal appointments |
| **Alerts** | `/api/alerts` | 3 | Danger sign alerts management |
| **Content** | `/api/content` | 6 | Articles, recommendations, likes |
| **Reports** | `/api/reports` | 4 | Upload, analyze, view reports |
| **SOS** | `/api/sos` | 5 | Emergency alerts with SMS/voice |

> 📖 Full API documentation available at `http://localhost:8000/docs` (Swagger UI)

---

## 🗄️ Database Schema

| Collection | Purpose | Key Fields |
|-----------|---------|-----------|
| `users` | User accounts & profiles | email, role, profile, health_data |
| `conversations` | AI chat history | user_id, messages[] |
| `health_records` | Vitals, mood, symptoms, approx. kicks | user_id, record_type, data |
| `milestones` | Pregnancy milestones | user_id, week, is_completed |
| `appointments` | Prenatal appointments | user_id, date, time, status |
| `alerts` | Health danger alerts | user_id, severity, is_read |
| `content` | Educational articles | category, tags, pregnancy_week_range |
| `reports` | Medical report analysis | user_id, analysis, key_values, risk_flags |
| `sos_alerts` | Emergency SOS alerts | user_id, severity, location, notified_contacts |

---

## 🎨 Design Philosophy

- **Dark Theme** — Easy on the eyes, especially for nighttime use during pregnancy
- **Glassmorphism** — Modern, premium feel with frosted glass effects
- **Rose/Pink Accent** — Warm, nurturing primary color (`#e85d75`)
- **Mobile First** — Responsive design works on phones, tablets, and desktops
- **Cultural Sensitivity** — Content tailored for Indian mothers (diet, traditions, Garbhasanskar)
- **Accessibility** — Large touch targets, clear typography, emoji-enhanced readability

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the architecture pattern: Model → Schema → Service → Route → Frontend Page
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👩‍💻 Authors

- **Your Name** — *Full Stack Development*

---

## 🙏 Acknowledgments

- **WHO & ICMR** — Health guidelines and recommendations
- **Groq** — Free, fast LLM inference
- **Twilio** — SMS and voice call APIs
- **MongoDB** — Flexible document database
- **Next.js & FastAPI** — Excellent developer experience

---

<p align="center">
  <strong>MatruSakhi</strong> — Because every mother deserves a companion. 💕
</p>
