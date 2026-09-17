# 🚀 Startup Validator AI

> **Autonomous 5-Agent Startup Validation Engine for Instant Market Analysis, Financial Projections, and Strategic Execution.**

🌐 **Live Demo:** [aistartuplaunchteam.vercel.app](https://aistartuplaunchteam-a0peaiexa-mehmoodrehan708-5335s-projects.vercel.app/)

---

## 📌 About The Project

**Startup Validator AI** is an intelligent, multi-agent AI platform built to help founders, product strategists, and investors validate early-stage business ideas in minutes instead of weeks. 

Traditional startup validation requires endless market research, competitor profiling, financial forecasting, and go-to-market planning. Startup Validator AI automates this complex analysis using a team of specialized, autonomous AI agents—orchestrated to deliver deep, actionable, and data-backed business insights.

The platform orchestrates **5 specialized agents**:
- **📊 Market Research Agent:** Analyzes TAM/SAM/SOM, market trends, target demographics, and competitor landscapes.
- **⚡ Product Strategy Agent:** Outlines core features, technical architecture, product roadmap, and MVP scope.
- **💰 Financial Modeling Agent:** Generates unit economics, revenue models, burn rates, and financial projections.
- **🎯 Marketing & GTM Agent:** Crafts customer acquisition channels, positioning, and go-to-market strategies.
- **🧠 Executive Coordinator Agent:** Orchestrates inter-agent workflows and synthesizes a comprehensive final executive report.

---

## ✨ Key Features

- **🤖 Autonomous Multi-Agent Pipeline:** Powered by **LangChain**, **LangGraph**, and **Groq** for high-speed, parallel reasoning and seamless agent orchestration.
- **💬 Interactive Human-in-the-Loop (HITL):** Real-time revision system allowing users to feed counter-arguments, adjust assumptions, and refine agent outputs.
- **🗂️ Session & History Management:** Supabase-backed persistent chat session storage with inline session renaming, deletion, and session switching.
- **📄 Professional PDF Report Export:** Instant generation of branded, publication-ready PDF validation reports complete with sample outputs and mandatory safety disclaimers.
- **🎨 Glassmorphic Dark-Themed UI:** Ultra-modern, fully responsive interface built with **Next.js (App Router)** and **Tailwind CSS**.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, Spline / Three.js |
| **Backend & AI** | Node.js, Python, LangChain, LangGraph, Groq API, Streaming Endpoints |
| **Database & Auth** | Supabase (PostgreSQL), Firebase Auth |
| **Deployment & Tools** | Vercel, Render, Git |

---

## ⚙️ Getting Started & Installation

Follow these instructions to set up and run Startup Validator AI on your local machine.

### 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **Python** (v3.10 or higher)
- **Git**

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/rehan-mehmood-tech/AI-Startup-Launch-team.git
cd AI-Startup-Launch-team
```

---

### 2️⃣ Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables by creating `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
   Add your respective keys to `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Access the web app at `http://localhost:3000`.

---

### 3️⃣ Backend Setup

1. Open a new terminal tab and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Windows:**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\activate
     ```
   - **macOS/Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables in `.env`:
   ```env
   GROQ_API_KEY=your_groq_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

5. Start the backend API server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

---

## 📁 Project Directory Structure

```ascii
AI-Startup-Launch-team/
├── backend/
│   ├── app/
│   │   ├── agents/          # Multi-agent implementations (Market, Strategy, Finance, GTM, Exec)
│   │   ├── api/             # API routes & streaming endpoints
│   │   ├── db/              # Supabase database connection & queries
│   │   ├── models/          # Data schemas and validation models
│   │   ├── services/        # Business logic & HITL execution services
│   │   ├── tools/           # Custom LangChain search & analysis tools
│   │   └── main.py          # Backend application entry point
│   ├── database_schema.sql  # PostgreSQL database schema & tables
│   ├── hitl_chat_schema.sql # HITL chat & session storage schema
│   └── requirements.txt     # Backend Python dependencies
│
├── frontend/
│   ├── app/                 # Next.js App Router pages
│   │   ├── dashboard/       # Founder dashboard view
│   │   ├── validate/        # Interactive validation workspace
│   │   ├── pipeline/        # Real-time multi-agent execution pipeline
│   │   ├── report/          # PDF report generation & export hub
│   │   ├── globals.css      # Global styles & glassmorphic theme
│   │   └── layout.tsx       # Root layout component
│   ├── components/          # Reusable UI components & agent cards
│   ├── lib/                 # Utility functions & Supabase client setup
│   ├── package.json         # Frontend dependencies & scripts
│   └── tailwind.config.mjs  # Tailwind CSS configuration
│
└── README.md                # Project documentation
```

---

## 🔒 Safety & Disclaimers

> **Notice:** Output generated by Startup Validator AI agents is provided for informational and preliminary planning purposes only. Founders should independently verify financial metrics, market data, and regulatory requirements prior to committing capital or executing business operations.
