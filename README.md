# 🌿 Weed Therapy App

Weed Therapy is an AI-assisted wellness companion that blends mindful cannabis journaling with emotionally intelligent conversations. Users chat with a supportive “weed therapist,” complete daily check-ins, and revisit past sessions for ongoing self-awareness and relapse prevention. The experience is powered by a full-stack architecture that pairs Google’s Gemini models with a secure, scalable backend.

**Link to project:** https://weed-therapy.vercel.app/

---

## How It's Made:

**Tech used:** React, Tailwind CSS, Node.js, Express, MongoDB, Cloudinary, JWT Auth, Google Gemini API, Web Speech API

- **Frontend:**
  - React + Tailwind CSS for a calming, mobile-first UI
  - React Query (or equivalent hooks) for data fetching and caching
  - Session-type–aware chat flows (e.g., Crisis, Grounding, Daily Journal, Guided Reflection, Habit Builder)
  - Daily Check-In popup integrated with backend state + localStorage
  - Anonymous mode banner and visual affordances
  - Web Speech API for speech-to-text message input
  - Smooth auto-scroll, animated typing indicators, micro-interactions

- **Backend:**
  - Node.js + Express REST API
  - Mongoose models for users, sessions, daily check-ins, and (future) coping strategy logs
  - Route-level middlewares for auth, validation, and rate limiting
  - Dedicated controllers for:
    - Session lifecycle (start, continue, end, list)
    - Daily check-ins (`/api/checkin/today`, `/api/checkin`)
    - Session types registry (general, crisis, guided_reflection, daily_journal, etc.)

- **Authentication:**
  - JWT-based session management
  - Refresh-token flow and token verification middleware
  - Secure cookie handling and user-scoped resource access
  - User-specific localStorage keys for check-in prompts to avoid cross-account leaking

- **Database:**
  - MongoDB with Mongoose:
    - `User` – auth, preferences, anonymization flags
    - `Session` – chat transcripts, session type, metadata (e.g., anonymous)
    - `DailyCheckin` – mood, craving, stress, notes, timestamps
    - (Planned) `SessionLog` / `CopingStrategy` – structured recovery data
  - Indices and timestamps for efficient querying of user histories and streaks

- **AI Integration:**
  - Google Gemini API for empathetic, context-aware responses
  - Prompt templates tuned for different session types (e.g., Crisis vs Grounding vs Reflection)
  - Structured responses for “Acknowledge → Suggest → Reassure”
  - Safety filters and guardrails for sensitive mental health topics

- **Media Handling:**
  - Cloudinary for storing avatars and future audio / mood log assets
  - Ready for inline media expansion (voice notes, mood snippets)

- **Mobile (WIP):**
  - React Native client that reuses:
    - Auth services
    - Session APIs
    - Check-in endpoints
  - REST + (future) websockets abstraction for real-time updates

- **Deployment:**
  - Frontend on Vercel
  - Backend deployable on Render / AWS / GCP with environment-based config
  - Environment variables for Gemini, MongoDB, JWT, Cloudinary, etc.

---

## Project Overview:

- **Conversational AI coaching:**  
  Gemini powers a supportive, mindfulness-focused “weed therapist” that adapts responses based on session type (e.g., craving emergency vs daily reflection).

- **Daily Check-In system:**  
  Users log mood, craving level, stress, and notes through a dedicated daily check-in flow. The app:
  - Reminds users once per day with a smart popup
  - Persists entries to MongoDB with user-scoped keys
  - Avoids duplicate prompts per user per day

- **Session-type–driven flows:**  
  Instead of a single generic chatbot, users pick from structured session types like:
  - General Therapy
  - Craving Emergency Help
  - Stress Coping
  - Mood Regulation
  - Grounding / Mindfulness
  - Relapse Reflection
  - Guided Reflection
  - Daily Journal
  - Habit Builder  
  Each type has its own intro tone and subtle guidance style.

- **Anonymous Mode:**  
  Users can start fully anonymous sessions:
  - Sessions are stored without personal identifiers
  - The UI clearly marks “Anon” sessions and avoids collecting identifying details
  - Great for early-stage or high-stigma users

- **Persistent reflection:**  
  Authenticated users can revisit past sessions and continue where they left off. Chat history is:
  - Encrypted and stored in MongoDB
  - Loaded selectively to prevent over-fetching
  - Filtered to hide internal system prompts

- **Full-stack delivery:**  
  Production-ready React frontend + RESTful Node/Express backend. The app is structured for:
  - Easy feature addition (new session types, new dashboards)
  - Clear separation of concerns between UI, services, and controllers

- **Cross-platform roadmap:**  
  A React Native client is in progress, sharing business logic and API contracts to deliver a consistent experience across mobile and web.

---

## Optimizations

- **Selective History Fetching:**  
  Replaced broad client-side history storage with:
  - User-scoped MongoDB queries
  - Paginated or sliced transcripts
  - ~54% reduction in CSR payload for busy users

- **Session-Type Registry & Ordering:**  
  Centralized session type definitions in the backend and:
  - Whitelisted canonical types (e.g., `guided_reflection`, `daily_journal`, `habit_builder`)
  - Removed legacy/duplicate types via frontend filtering
  - Enforced a UX-first ordering so reflective modes appear where they’re most discoverable

- **Daily Check-In Logic:**  
  - Combined backend “did user check in today?” with user-specific localStorage keys
  - Ensured check-in prompts are:
    - Once-per-day per user
    - Robust to browser refreshes
  - Fails open (shows popup) if backend check fails, to avoid missing data

- **API Protection:**  
  - Global rate limiting and per-user throttles around AI endpoints
  - Input validation middleware to guard against malformed payloads
  - Basic abuse detection around session creation and chat length

- **Prompt Engineering:**  
  - Session-type–aware prompt templates (Crisis, Grounding, Reflection, Habit)
  - Post-processing to enforce a consistent structure like:
    - “Acknowledge → Normalize → Suggest → Reassure”
  - Token budgeting and truncation strategies for long-running sessions

- **Performance:**  
  - Lazy-loading chat logs and check-in history
  - Auto-scroll tuned to avoid jank for long sessions
  - Optimistic UI for message sending + streaming-like typing indicators
  - Web Speech API integration without blocking the main UX thread

- **UX Polish:**  
  - Calming, desaturated greens and neutrals for a therapeutic vibe
  - Mobile-first layout with sticky session controls on small screens
  - Clean modals for:
    - Session picker
    - New session creation
    - Daily check-in prompts
  - Accessibility-conscious spacing, contrast, and focus states

---

## Future Enhancements

- **Offline-first Mode:**  
  - Cache recent transcripts, prompts, and check-ins via IndexedDB
  - Allow basic journaling and self-reflection without a network
  - Sync changes when connectivity returns

- **Expanded Languages:**  
  - Multi-language support via:
    - Locale-aware prompts
    - Localized UI copy
    - Optional machine translation layer

- **React Native Release:**  
  - Ship the in-progress mobile client
  - Reuse services for auth, sessions, and check-ins
  - Align interaction patterns with native mobile UX (bottom sheet modals, haptics, etc.)

---

## Lessons Learned:

- **LLM Integration:**  
  - Built production-grade flows around Gemini:
    - Prompt templating per session type
    - Safety filters and fallbacks
    - Token usage tracking and context window management

- **Secure Personalization:**  
  - Balanced emotional personalization with privacy:
    - Scoped JWT auth and user-based access control
    - Per-user localStorage keys (e.g., daily check-in prompts)
    - Encryption-at-rest for sensitive content where applicable

- **AI Ethics & Safety:**  
  - Designed flows that:
    - Encourage reflection and self-regulation, not diagnosis
    - Include appropriate language for crisis guidance and escalation
    - Avoid pretending to replace clinical care

- **Digital Therapeutic Architecture:**  
  - Evolved the app from a simple chatbot into a structured system with:
    - Session types
    - Daily check-ins
    - Anonymous mode
    - Planned analytics and dashboards

- **Full-Stack Orchestration:**  
  - Strengthened patterns for:
    - Connecting React, Node, and MongoDB
    - Keeping code modular and maintainable
    - Preparing for multi-client (web + mobile) reuse

---

## Examples:

Take a look at these examples of AI integration & research from my portfolio:

- **Car Check:** https://car-check-iota.vercel.app/  
- **ANPR SYSTEM:** https://github.com/adeymoe/ANPR-system  
- **AI-ENABLED FEDERATED DEEP LEARNING CYBERSECURITY FRAMEWORK FOR DECENTRALIZED IOT ECOSYSTEMS:**  
  https://taapublications.com/tijsrat/article/view/781

---

## 🧪 Running the Project Locally

```bash
# 1. Clone repository
git clone https://github.com/<your-username>/weed-therapy.git
cd weed-therapy

# 2. Install dependencies (frontend)
npm install

# 3. Install backend dependencies
cd backend
npm install

# 4. Configure environment
# Create .env files for frontend and backend (see .env.example in each)
# Frontend examples:
#   VITE_BACKEND_URL=http://localhost:5000
#
# Backend examples:
#   MONGODB_URI=your_mongodb_connection_string
#   GEMINI_API_KEY=your_gemini_api_key
#   JWT_ACCESS_SECRET=your_access_secret
#   JWT_REFRESH_SECRET=your_refresh_secret
#   CLOUDINARY_CLOUD_NAME=...
#   CLOUDINARY_API_KEY=...
#   CLOUDINARY_API_SECRET=...

# 5. Run development servers

# In one terminal (frontend)
cd ..
npm run dev

# In another terminal (backend/)
cd backend
npm run dev