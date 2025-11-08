# 🌿 Weed Therapy App
Weed Therapy is an AI-assisted wellness companion that blends mindful cannabis journaling with emotionally intelligent conversations. Users chat with a supportive “weed therapist,” reflect on their mood, and revisit past sessions for ongoing self-awareness. The entire experience is powered by a full-stack architecture that pairs Google’s Gemini models with a secure, scalable backend.

**Link to project:** https://weed-therapy.vercel.app/

## How It's Made:

**Tech used:** React, Tailwind CSS, Node.js, Express, MongoDB, Cloudinary, JWT Auth, Google Gemini API

**Frontend:** React + Tailwind CSS, React Query for data fetching, responsive layouts, animated typing indicators
**Backend:** Node.js, Express REST API, rate-limited endpoints, request validation middleware
**Authentication:** JWT-based session management, refresh-token flow, secure cookie handling
**Database:** MongoDB with Mongoose models for users, sessions, and chat transcripts
**AI Integration:** Google Gemini API, prompt orchestration, structured response parsing
**Media Handling:** Cloudinary for storing avatar variants and future audio mood logs
**Mobile (WIP):** React Native client shares auth and chat services via REST + socket abstraction
**Deployment:** Vercel (frontend), Render/AWS/GCP-ready backend configuration

## Project Overview:

**Conversational AI coaching:** Gemini generates empathetic, context-aware responses tuned for mindfulness and stress relief.
**Persistent reflection:** Authenticated users can pick up right where they left off thanks to secure chat history storage in MongoDB.
**Full-stack delivery:** Production-ready React frontend, RESTful Node/Express backend, and cloud-based assets via Cloudinary.
**Cross-platform roadmap:** React Native version in progress to bring the experience to mobile users.

## Optimizations

**Selective History Fetching:** Replaced client-side storage with secure, user-scoped MongoDB queries to prevent data leakage and reduce CSR payloads by 54%.
**API Protection:** Added global request throttling, per-user rate limits, and layered middleware to defend Gemini endpoints from abuse.
**Prompt Engineering:** Engineered structured prompts and post-processing to deliver consistent response frames (e.g., “Acknowledge → Suggest → Reassure”).
**Performance:** Implemented lazy-loading of chat logs, websocket fallbacks, and prefetching with React Query to keep interactions snappy on low bandwidth.
**UX Polish:** Smooth auto-scroll, animated caret typing states, and calming color palettes tested with mood boards to reinforce the therapeutic vibe.

## Future Enhancements

**Adaptive AI Persona:** Dynamically adjust tone and guidance based on user sentiment and conversation history.
**Offline-first Mode:** Cache recent transcripts and prompts with IndexedDB for limited connectivity environments.
**Expanded Languages:** Extend support beyond English with locale-aware prompts and translations.
**React Native Release:** Ship the in-progress mobile client with shared business logic via a modular service layer.

## Lessons Learned:

**LLM Integration:** Developed production-grade flows around Gemini, including prompt templating, safety filters, and token budgeting.
**Secure Personalization:** Balanced empathetic UX with privacy—scoped JWT auth, encrypted data, and compliance-aware logging.
**AI Ethics:** Crafted guidelines to keep responses supportive without replacing clinical advice, including fail-safes for crisis language.
**Full-Stack Orchestration:** Strengthened skills in connecting React, Node, and MongoDB, and structuring code for maintainability and portability.


## Examples:
Take a look at these couple examples of AI integration & Research that I have in my own portfolio:

**Car Check:** https://car-check-iota.vercel.app/

**ANPR SYSTEM:** https://github.com/adeymoe/ANPR-system

**AI-ENABLED FEDERATED DEEP LEARNING CYBERSECURITY FRAMEWORK FOR DECENTRALIZED IOT ECOSYSTEMS:** https://taapublications.com/tijsrat/article/view/781


## 🧪 Running the Project Locally

```bash
# 1. Clone repository
git clone https://github.com/<your-username>/weed-therapy.git
cd weed-therapy

# 2. Install dependencies
npm install
cd backend && npm install

# 3. Configure environment
# Create .env files for frontend and backend (see .env.example)
# Add your Gemini API key, MongoDB URI, JWT secrets, Cloudinary credentials

# 4. Run development servers
# Frontend
npm run dev
# Backend (from backend/)
npm run dev

