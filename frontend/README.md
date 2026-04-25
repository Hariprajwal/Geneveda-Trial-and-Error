<div align="center">
  <img src="https://raw.githubusercontent.com/Hariprajwal/Alvas-Hackthon-frontend/exp1/src/assets/logo.png" alt="GenVeda Logo" width="120" style="border-radius: 20px; margin-bottom: 20px;" onerror="this.src='https://ui-avatars.com/api/?name=Gen+Veda&background=1a237e&color=fff&size=120&rounded=true'" />

  # 🧬 GenVeda Clinical Intelligence UI
  
  **A Next-Generation AI-Powered Dermatology & Clinical Workflow Platform**

  [![React](https://img.shields.io/badge/React-18.x-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

  [Overview](#-overview) •
  [Features](#-key-features) •
  [Architecture](#-architecture) •
  [Installation](#-getting-started) •
  [Roles & Workflows](#-role-based-workflows)
</div>

---

## 📖 Overview

The **GenVeda Frontend** is a modern, responsive, and highly secure web application built to facilitate seamless interactions between patients, nurses, and doctors. Powered by advanced **RAG (Retrieval-Augmented Generation)** models and real-time medical image analysis, the platform automates triaging, provides role-specific AI assistance, and drastically reduces clinical latency for high-risk dermatological anomalies.

## ✨ Key Features

- **🎯 Role-Based Architecture:** Strictly sandboxed dashboards, routing, and toolsets for **Doctors**, **Nurses**, and **Patients**.
- **🤖 Specialized RAG AI Assistants:**
  - *Patient Mode:* Empathic, plain-language symptom guidance and ABCDE rule education.
  - *Nurse Mode:* Fast retrieval of wound care protocols, escalation criteria, and medication triage.
  - *Doctor Mode:* Deep differential diagnosis, AAD/NICE protocol fetching, and dermoscopy interpretations.
- **🚨 Autonomous Escalation Engine:** Scans returning an AI confidence score of `HIGH` risk (>67%) bypass standard queues and automatically generate an `Order ID` (e.g., `GV-0042`) in the Doctor's **Immediate Cases** dashboard.
- **🖼️ Full-Width Medical UI:** A zero-compromise, edge-to-edge design optimized for viewing high-resolution skin lesions and detailed clinical reports.
- **🎙️ Voice Integration:** Optional browser-native speech-to-text dictation across all clinical inputs to save time during charting.

---

## 🏗 Architecture & Stack

- **Framework:** [React 18](https://react.dev/) powered by [Vite](https://vitejs.dev/) for blazing fast HMR.
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with a custom design token system (Material 3 inspired colors, typography).
- **Routing:** `react-router-dom` with robust `PrivateRoute` and `RoleRoute` interceptors.
- **State Management:** React Hooks (`useState`, `useEffect`) paired with LocalStorage caching for session persistence.
- **API Integration:** Axios-based centralized API service (`src/services/api.jsx`) configured for JWT Bearer token authentication.

---

## 👥 Role-Based Workflows

### 👨‍⚕️ The Doctor Portal
- **Dashboard Overview:** High-level metrics, recent patient scans, and urgent queue monitoring.
- **Immediate Cases (🚨):** An auto-populated dashboard of AI-escalated high-risk lesions requiring instant intervention.
- **Clinical Chat:** RAG-powered assistant connected to PubMed and Wikipedia for evidence-based decision support.

### 👩‍⚕️ The Nurse/Triage Portal
- **Scan & Input:** Fast capture of patient symptoms, duration, and clinical images.
- **Result & Escalation:** Pre-screening results. Nurses can manually escalate cases or rely on the AI's auto-escalation trigger.
- **Care AI:** Protocol and triage assistance designed specifically for nursing scope of practice.

### 👤 The Patient Experience
- **Symptom Checker:** An intuitive, multi-step flow to report symptoms and upload lesion images securely.
- **My Reports:** A beautiful, full-width digital medical record displaying risk categories in human-readable terms.
- **Health Assistant:** Friendly, non-diagnostic AI support to help patients understand when to seek immediate care.

---

## 🚀 Getting Started

### Prerequisites
Ensure you have the following installed:
- **Node.js** (v18.x or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Hariprajwal/Alvas-Hackthon-frontend.git
   cd Alvas-Hackthon-frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory (if needed for API overrides):
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The application will boot up at `http://localhost:5173/`.*

---

## 🔐 Security & Data Handling
- **No Markdown LLM Rendering:** All AI responses pass through a strict regex sanitizer (`cleanResponse.js`) to strip markdown and ensure perfectly formatted, secure plain-text rendering.
- **Route Guarding:** Unauthorized role access immediately redirects to the login boundary.
- **JWT Lifecycles:** Tokens are strictly managed and purged upon logout or expiration.

<div align="center">
  <br />
  <p><i>Built for the Alvas Hackathon — Engineering the Future of Healthcare</i></p>
</div>
