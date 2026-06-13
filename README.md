# ReceiptPrint — Carbon Footprint Tracker

ReceiptPrint is an intelligent full-stack web application designed for **PromptWars Challenge 3**. Users upload grocery or shopping receipts, and the app automatically extracts purchased items via **Groq AI (Llama 3.2 Vision)**, maps them to a localized Indian carbon emissions database, and returns personalized insights and sustainable swap suggestions while tracking carbon trends over time.

---

## Technical Stack
- **Frontend:** React + Vite + Tailwind CSS + Lucide Icons
- **Backend:** Node.js + Express
- **AI:** Groq AI (Llama 3.2 11B Vision)
- **Database/Auth:** Supabase (Auth + PostgreSQL Database + Storage)
- **Testing:** Jest

---

## Folder Structure

```text
ReceiptPrint/
├── backend/
│   ├── src/
│   │   ├── data/
│   │   │   ├── emissions.json    # India-localised CO2 database
│   │   │   └── schema.sql        # Supabase database setup SQL
│   │   ├── middleware/
│   │   │   ├── auth.js           # Supabase JWT authentication check
│   │   │   └── upload.js         # Multer validation (file types, <=5MB)
│   │   ├── routes/
│   │   │   ├── analyze.js        # Receipt OCR and carbon matching route
│   │   │   └── history.js        # GET/POST/DELETE history endpoints
│   │   ├── services/
│   │   │   └── groqService.js    # Groq API vision calls & JSON parsing
│   │   └── utils/
│   │       ├── carbonMapper.js   # Fuzzy matching + local cache + calculations
│   │       └── supabaseClient.js # Supabase connection initialization
│   ├── tests/
│   │   └── carbonMapper.test.js  # Jest unit tests
│   ├── .env.example
│   ├── server.js                 # Express server entry point
│   └── package.json
└── frontend/
    ├── src/
    │   ├── assets/               # Leaf SVG icons and visual items
    │   ├── components/
    │   │   ├── Auth.jsx          # Login/registration component
    │   │   ├── Dashboard.jsx     # Detailed results metrics
    │   │   ├── History.jsx       # Custom SVG area chart + past logs list
    │   │   ├── SwapSuggestions.jsx # Sustainable swaps list
    │   │   └── UploadZone.jsx    # Device-aware upload/camera container
    │   ├── utils/
    │   │   └── supabaseClient.js # Frontend Supabase initialization
    │   ├── App.jsx               # Main screen controller
    │   ├── index.css             # Tailwind setup and focus rings
    │   └── main.jsx
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── package.json
```

---

## Configuration & Environment Variables

### Backend Configuration
Create a `.env` file in the `/backend` folder:
```env
PORT=5000
GROQ_API_KEY=gsk_your_groq_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Frontend Configuration
Create a `.env` file in the `/frontend` folder:
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

> [!NOTE]
> **Demo / Offline Simulation Mode:** If Supabase credentials are not provided or remain at default values, the frontend will automatically fall back to **Demo Simulation Mode**. This allows signing in with any email/password, stores history logs inside browser `localStorage`, and provides a fully interactive demo of the scanner, mapping, and trend charts.

---

## Database Setup

Run the SQL script located in [schema.sql](file:///d:/RecieptPrint/backend/src/data/schema.sql) in your Supabase SQL editor to create the `receipts` and `receipt_items` tables, enable Row Level Security (RLS), and configure cascading deletes.

---

## Installation & Running

### Step 1: Run the Backend
1. Navigate to the `/backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm start
   ```
The backend server will run on `http://localhost:5000`.

### Step 2: Run the Frontend
1. Navigate to the `/frontend` directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
Open the provided browser link (usually `http://localhost:5173`) to view and interact with the application.

---

## Execution of Tests

The carbon mapping unit tests are located in [carbonMapper.test.js](file:///d:/RecieptPrint/backend/tests/carbonMapper.test.js). To execute them:
1. Navigate to the `/backend` folder.
2. Run:
   ```bash
   npm test
   ```
The test suite validates known item mapping, unknown item fallback, and zero quantity edge cases.

---

## Key Features & Accessibility

1. **AI vision extraction:** Powered by Groq's Llama 3.2 Vision model. Captures receipt details in exactly one prompt and returns structured JSON safely.
2. **Carbon database mapping:** Standardized calculations, unit conversions (e.g. `g` to `kg`, `ml` to `litre`), caching of lookups, and category sorting happen completely in custom Javascript code.
3. **Security focus:** `GROQ_API_KEY` never exists in the frontend. All uploaded files are validated server-side for size (<=5MB) and type (JPEG, PNG, PDF), and authorization tokens are verified before operations.
4. **Device awareness:** Detects mobile vs desktop. On mobile, triggers native camera capturing with a preview and "Confirm/Retake" flow, using client-side compression. On desktop, shows a keyboard-accessible drag-and-drop zone and rasterizes PDF page 1 using `pdf.js`.
5. **Accessibility first:** Fully navigable using keyboard (outlines enabled on focus), status badges don't rely on color alone (uses Warning/Check icons & text ratings for color-blind users), and SVG charts provide companion screen-reader tables.
