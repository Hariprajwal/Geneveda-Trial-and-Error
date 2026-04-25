<div align="center">
  <img src="https://ui-avatars.com/api/?name=Gen+Veda&background=004D40&color=fff&size=150&rounded=true" alt="GenVeda Logo" width="150" />

  # 🧬 GenVeda Clinical Intelligence
  
  **A Next-Generation AI-Powered Dermatology & Clinical Workflow Platform Built for Bharat**

  [![React](https://img.shields.io/badge/React-18.x-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Django](https://img.shields.io/badge/Django-5.x-092E20.svg?style=for-the-badge&logo=django)](https://www.djangoproject.com/)
  [![TensorFlow](https://img.shields.io/badge/TensorFlow-2.x-FF6F00.svg?style=for-the-badge&logo=tensorflow)](https://www.tensorflow.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.x-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
</div>

---

## 📖 Overview

**GenVeda Clinical Intelligence** is a cutting-edge, full-stack medical triage and AI diagnostics platform designed specifically for rural clinics and multi-tier healthcare environments. 

By combining real-time edge AI skin lesion analysis, Multilingual Retrieval-Augmented Generation (RAG), and a strictly sandboxed multi-role architecture, GenVeda bridges the gap between resource-constrained primary care centers and specialized dermatologists. 

Built with the vision of **"Made for India"**, GenVeda natively supports local languages like Kannada and English, features voice-assisted dictation, and integrates directly with USB Dermoscopes.

---

## ✨ Core Innovations

### 🧠 1. Real-Time AI Diagnosis Engine
- **Edge-Optimized CNN:** Powered by a custom **MobileNetV2** architecture trained on the HAM10000 dataset.
- **7-Class Classification:** Accurately detects Melanocytic Nevus, Melanoma, Benign Keratosis, Basal Cell Carcinoma, Actinic Keratosis, Vascular Lesions, and Dermatofibroma.
- **Explainable AI (XAI):** Returns full softmax probability arrays and computes weighted clinical risk scores (`0-100%`) for transparent decision making.

### 🤖 2. Multilingual RAG AI Assistant
- **Contextual Medical Chat:** Answers patient and clinician queries using real-time medical context crawled from PubMed, Wikipedia, and DuckDuckGo.
- **Native Language Enforcement:** The AI detects and strictly responds in the user's native language (e.g., Kannada to Kannada), ensuring zero language barriers.
- **High-Availability LLM Failover:** Primary reasoning powered by advanced models with an automatic, silent failover to OpenRouter (Llama 3.1 8B, Gemma 3, Mistral) ensuring 99.9% uptime.

### 🚨 3. Smart Clinical Escalation
- **Autonomous Triage:** Scans returning an AI confidence score of `HIGH` risk automatically bypass standard queues.
- **Immediate Intervention:** Generates urgent Order IDs (e.g., `GV-0042`) directly in the Doctor's **Immediate Cases** dashboard for rapid review.

### 🔒 4. Blockchain-Secured EHR & Voice Features
- **Cryptographic Records:** Patient EHRs and scan logs are cryptographically secured using SHA-256 hashing.
- **Voice-Assisted Clinical Notes:** Built-in browser-native speech-to-text allows nurses and doctors to dictate prescriptions and notes in English or Kannada effortlessly.

---
<img width="1536" height="1024" alt="WhatsApp Image 2026-04-25 at 10 50 34 AM" src="https://github.com/user-attachments/assets/06bd2c2b-11c7-4e20-a24e-f1c09c9ce9dd" />
<img width="1536" height="1024" alt="WhatsApp Image 2026-04-25 at 10 50 34 AM" src="https://github.com/user-attachments/assets/6d113a98-1a15-47d0-bd22-35de72edca39" />
<img width="1523" height="1600" alt="WhatsApp Image 2026-04-25 at 10 50 34 AM (2)" src="https://github.com/user-attachments/assets/ad41b756-a578-46a2-b666-725f83ec21ff" />
<img width="1523" height="1600" alt="WhatsApp Image 2026-04-25 at 10 50 34 AM (2)" src="https://github.com/user-attachments/assets/9a3f5900-9df5-45ad-ab7f-09d12b7b8fac" />
<img width="1600" height="571" alt="WhatsApp Image 2026-04-25 at 10 50 35 AM" src="https://github.com/user-attachments/assets/505f5b6e-3339-41c4-90b7-d8032b6a5082" />
<img width="1536" height="1024" alt="WhatsApp Image 2026-04-25 at 10 50 35 AM (3)" src="https://github.com/user-attachments/assets/3d14655b-096a-45a7-a2f0-ff08c104c49d" />
<img width="1536" height="1024" alt="WhatsApp Image 2026-04-25 at 10 50 35 AM (3)" src="https://github.com/user-attachments/assets/554da08e-ef3f-40aa-a487-236ea1355b8d" />
<img width="1600" height="899" alt="WhatsApp Image 2026-04-25 at 10 52 18 AM" src="https://github.com/user-attachments/assets/b8eeea0a-7587-4d51-bd31-8e5aaa5a0554" />











## 🏗 System Architecture

```mermaid
graph TD
    subgraph Frontend [React / Vite UI]
        P[Patient Portal]
        N[Nurse / Triage Portal]
        D[Doctor Dashboard]
    end

    subgraph API [Django REST Framework]
        A[Auth & Role Routing]
        R[RAG Chat Engine]
        S[Scan Logging & EHR]
    end

    subgraph AI [Machine Learning Pipeline]
        CNN[MobileNetV2 Model .h5]
        LLM[LLM Routing Engine]
    end

    subgraph External [External Services]
        OR[OpenRouter / Cerebras APIs]
        Crawlers[PubMed / Wiki Crawlers]
    end

    P <-->|JWT Auth| A
    N <-->|JWT Auth| A
    D <-->|JWT Auth| A

    A --> S
    S --> CNN
    
    A --> R
    R --> LLM
    LLM --> OR
    R --> Crawlers
```

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 18 with Vite for blazing fast HMR.
- **Styling:** Tailwind CSS & Custom CSS Custom Properties for seamless Dark/Light theming.
- **Routing:** `react-router-dom` with robust `RoleRoute` interceptors.
- **State & i18n:** Custom React Contexts for dynamic Language (English/Kannada) and Theme switching.

### Backend
- **Framework:** Django 5.x, Django REST Framework (DRF)
- **Database:** SQLite3 (Configured for standard relational modeling)
- **Security:** JWT Bearer Token Authentication.

### Machine Learning
- **Computer Vision:** TensorFlow, Keras, OpenCV, Pillow.
- **NLP / RAG:** Python Requests, Regex Sanitizers, Dynamic Prompt Engineering.

---

## 🚀 Getting Started

Follow these steps to run the GenVeda platform locally.

### Prerequisites
- **Python** (v3.10 or higher)
- **Node.js** (v18.x or higher)
- **Git**

### 1. Backend Setup

Open a terminal and navigate to the `backend` folder:

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows
.\venv\Scripts\activate
# MacOS/Linux
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt

# Run Migrations
python manage.py makemigrations APIs
python manage.py migrate

# Start the Django Server
python manage.py runserver
```
*The backend server will run on `http://127.0.0.1:8000/`*

### 2. Frontend Setup

Open a new terminal and navigate to the `frontend` folder:

```bash
cd frontend

# Install Dependencies
npm install

# Start the Vite Development Server
npm run dev
```
*The frontend application will boot up at `http://localhost:5173/`*

### 3. Environment Variables

If you wish to test the RAG chatbot features, create a `.env` file in the `backend` folder with the following API keys:
```env
CEREBRAS_API_KEY=your_cerebras_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
```

---

## 👥 Role-Based Workflows

### 👨‍⚕️ The Doctor Portal
- **Dashboard Overview:** High-level metrics, recent patient scans, and urgent queue monitoring.
- **Immediate Cases:** Auto-populated dashboard of AI-escalated high-risk lesions requiring instant intervention.
- **Clinical Insights:** RAG-powered assistant connected to medical literature for evidence-based decision support.

### 👩‍⚕️ The Nurse/Triage Portal
- **Scan & Input:** Fast capture of patient symptoms, duration, and clinical images via USB Dermoscope or webcam.
- **Result & Escalation:** Pre-screening AI results. Nurses can manually escalate cases or rely on the AI's auto-escalation trigger.
- **Voice Documentation:** Dictate patient history directly into the portal.

### 👤 The Patient Experience
- **Symptom Checker:** Intuitive, multi-step flow to report symptoms securely.
- **My Reports:** Full-width digital medical records displaying risk categories in human-readable, translated terms.
- **Health Assistant:** Friendly, non-diagnostic AI support to help patients understand when to seek immediate care.

---

<div align="center">
  <br />
  <p><i>Engineered for the Alvas Hackathon — Building the Future of Accessible Healthcare.</i></p>
</div>
