# RecieptPrint — Carbon Footprint Tracker

ReceiptPrint is an intelligent full-stack web application built for **PromptWars Challenge 3**. Upload a grocery or shopping receipt and the app automatically extracts every purchased item via **Groq AI (Llama 4 Scout Vision)**, maps items to a localised Indian CO₂ database, and returns a personalised carbon dashboard with sustainable swap suggestions — while tracking your footprint trend over time.

**Live demo:** https://reciept-print.vercel.app

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS + Lucide Icons |
| Backend | Node.js + Express |
| AI | Groq AI / xAI Grok (Llama 4 Scout 17B Vision) |
| Database & Auth | Supabase (Auth + PostgreSQL + Row Level Security) |
| Deployment | Vercel (frontend + serverless-compatible backend) |
| Testing | Jest |

---

## Folder Structure

```text
ReceiptPrint/
├── backend/
│   ├── src/
│   │   ├── data/
│   │   │   ├── emissions.json    # India-localised CO₂ database
│   │   │   └── schema.sql        # Supabase database setup SQL
│   │   ├── middleware/
│   │   │   ├── auth.js           # Supabase JWT authentication check
│   │   │   └── upload.js         # Multer validation (file types, ≤5MB)
│   │   ├── routes/
│   │   │   ├── analyze.js        # Receipt OCR and carbon matching route
│   │   │   └── history.js        # GET/POST/DELETE history endpoints
│   │   ├── services/
│   │   │   └── groqService.js    # Groq/xAI API vision calls & JSON parsing
│   │   └── utils/
│   │       ├── carbonMapper.js   # Fuzzy matching + local cache + calculations
│   │       └── supabaseClient.js # Supabase connection initialization
│   ├── tests/
│   │   └── carbonMapper.test.js  # Jest unit tests
│   ├── .env.example              # Required environment variable names
│   ├── server.js                 # Express server entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── assets/               # Icons and visual assets
    │   ├── components/
    │   │   ├── Auth.jsx          # Login/registration component
    │   │   ├── Dashboard.jsx     # Detailed results metrics (mobile)
    │   │   ├── History.jsx       # SVG area chart + receipt log
    │   │   ├── SwapSuggestions.jsx # Eco-swap cards
    │   │   └── UploadZone.jsx    # Device-aware upload/camera capture
    │   ├── desktop/
    │   │   ├── DesktopAuth.jsx   # Desktop login/register UI
    │   │   └── UploadPage.jsx    # Full desktop dashboard with ring chart
    │   ├── mobile/
    │   │   ├── HomeScreen.jsx    # Scan CTA
    │   │   ├── MobileAuth.jsx    # Mobile login/register
    │   │   ├── MobileShell.jsx   # Screen router + bottom nav
    │   │   ├── PreviewScreen.jsx # Animated progress + image preview
    │   │   ├── ResultsScreen.jsx # Ring chart + top offenders
    │   │   ├── SwapsScreen.jsx   # Swap cards + annual savings
    │   │   └── HistoryScreen.jsx # Carbon trend chart
    │   ├── utils/
    │   │   ├── api.js            # Frontend API helper (all calls to backend)
    │   │   └── supabaseClient.js # Frontend Supabase client
    │   ├── App.jsx               # Device-aware entry: routes mobile vs desktop
    │   ├── index.css             # Full design system + focus rings
    │   └── main.jsx
    ├── .env.example              # Required environment variable names
    ├── tailwind.config.js
    ├── index.html
    └── package.json
```

---

## Environment Variables

### Backend — create `/backend/.env`
```env
PORT=5000
GROQ_API_KEY=gsk_your_groq_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```
See [`backend/.env.example`](./backend/.env.example) for a copy-paste template.

### Frontend — create `/frontend/.env`
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```
See [`frontend/.env.example`](./frontend/.env.example) for a copy-paste template.

> [!NOTE]
> **Demo / Offline Simulation Mode:** If Supabase credentials are not provided, the frontend automatically falls back to **Demo Simulation Mode** — sign in with any email/password, history is stored in `localStorage`, and a fully interactive demo of the scanner, mapping, and trend charts is available with no external dependencies.

> [!IMPORTANT]
> **Security:** The `GROQ_API_KEY` **never** appears in the frontend bundle. All AI calls go exclusively through the Express backend. Verify this with DevTools → Network → search JS bundles for "Bearer", "gsk_", or "xai-" — you will find nothing.

---

## Database Setup

Run the SQL script in [`backend/src/data/schema.sql`](./backend/src/data/schema.sql) in your Supabase SQL editor to create the `receipts` and `receipt_items` tables, enable Row Level Security (RLS), and configure cascading deletes.

---

## Local Setup & Running

### Step 1: Clone the repo
```bash
git clone https://github.com/your-username/ReceiptPrint.git
cd ReceiptPrint
```

### Step 2: Run the Backend
```bash
cd backend
npm install
cp .env.example .env       # then fill in your API keys
npm start
```
The backend server runs on `http://localhost:5000`.

### Step 3: Run the Frontend
```bash
cd ../frontend
npm install
cp .env.example .env       # set VITE_API_URL=http://localhost:5000
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Running Tests

The carbon mapping unit tests are in [`backend/tests/carbonMapper.test.js`](./backend/tests/carbonMapper.test.js).

```bash
cd backend
npm test
```

The test suite validates:
- Known item matching (e.g. "Amul Milk" → dairy category)
- Unknown item fallback behaviour
- Zero quantity edge cases
- Unit conversion accuracy (g→kg, ml→litre)

---

## Key Features

| Feature | Detail |
|---|---|
| 🤖 AI Vision Extraction | Groq Llama 4 Scout 17B Vision — one prompt, returns structured JSON |
| 🌿 India-localised CO₂ DB | Custom `emissions.json` with Indian food items and petrol car averages (0.12 kg CO₂e/km) |
| 🔒 Security-first | API key never in frontend; server-side file validation (type + 5 MB limit); Supabase RLS |
| 📱 Device-aware UI | Mobile: native camera → preview → confirm flow. Desktop: keyboard-accessible drag-drop zone |
| ♻️ Eco Swap Suggestions | Receipt-driven — suggestions are generated from the actual extracted items, not generic |
| 📊 Annual Savings Card | "If you made all these swaps for 1 year: Save X kg CO₂e" on both mobile and desktop |
| 🕑 Persistent History | Supabase writes on every scan; reloads correctly after tab close/reopen |
| ⌨️ Accessibility | Keyboard-navigable, visible focus rings, ARIA labels, colour-blind safe (icon + text labels) |
| 🌍 Impact Comparison | Receipt footprint shown as km driven (Indian petrol car: 0.12 kg CO₂e/km) + smartphone charges |
