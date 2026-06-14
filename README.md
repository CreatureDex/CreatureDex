# 🦎 CreatureDex

> Photograph real-world animals and insects, build your collection, and battle other trainers — powered by AI.

---

## What is CreatureDex?

CreatureDex is a mobile app that turns the real world into your hunting ground. Point your camera at any animal or insect, and AI instantly identifies the species and adds it to your personal Dex as a battle-ready creature — complete with stats derived from real biological traits. Once you've built your collection, challenge other players to turn-based battles and climb the leaderboard.

Think Pokémon GO, but your creatures are the actual wildlife around you.

---

## Features

- 📸 **Snap & Identify** — photograph any animal or insect and let AI identify the species in seconds
- 🧬 **AI Stat Generation** — HP, Attack, Defence, Speed, and Special stats generated from real biological data (size, venom, speed, predator status)
- 🎒 **Creature Bag** — browse your full collection with species images, names, and stat cards
- ⚔️ **Turn-Based Battles** — challenge other players to live PvP battles with real-time state sync
- 🔔 **Push Notifications** — get alerted when someone challenges you or it's your turn
- 🔐 **Auth** — secure email/password login with JWT-based sessions

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo managed workflow) |
| Camera | expo-camera + expo-image-picker |
| Notifications | Expo Push Notifications |
| Backend | Python + FastAPI |
| Hosting | Render (free tier) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| Real-time | Supabase Realtime (WebSockets) |
| AI Identification | Google Gemini 1.5 Flash |
| Version Control | GitHub |

---

## Architecture

```
┌─────────────────────────────────────────┐
│            React Native App             │
│  (Expo · Camera · Push Notifications)  │
└──────────────┬──────────────────────────┘
               │ REST / WebSocket
               ▼
┌─────────────────────────────────────────┐
│           FastAPI Backend               │
│   (Game Logic · AI calls · JWT Auth)   │
└────────┬─────────────┬──────────────────┘
         │             │
         ▼             ▼
┌──────────────┐  ┌───────────────────────┐
│   Supabase   │  │  Google Gemini Flash  │
│  PostgreSQL  │  │  (Species ID + Traits)│
│  Auth        │  └───────────────────────┘
│  Storage     │
│  Realtime    │
└──────────────┘
```

---

## Project Structure

```
creaturedex/
├── mobile/                     # React Native (Expo)
│   └── src/
│       ├── features/
│       │   ├── auth/            # Login, signup screens
│       │   ├── camera/          # Capture + upload flow
│       │   ├── collection/      # Creature bag UI
│       │   └── battle/          # Turn-based battle UI
│       ├── components/          # Shared UI components
│       ├── hooks/               # Custom React hooks
│       └── lib/                 # Supabase client, API helpers
│
├── backend/                    # Python + FastAPI
│   ├── routers/
│   │   ├── auth.py              # JWT verification middleware
│   │   ├── creatures.py         # Identify, store, retrieve
│   │   └── battles.py           # Battle logic, state machine
│   ├── services/
│   │   ├── gemini.py            # Gemini Flash integration
│   │   └── stats.py             # Stat generation rules engine
│   ├── models.py                # Pydantic schemas
│   ├── database.py              # Supabase client
│   └── main.py                  # FastAPI app entry point
│
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Expo CLI (`npm install -g expo-cli`)
- A free [Supabase](https://supabase.com) account
- A free [Google AI Studio](https://aistudio.google.com) API key
- A free [Render](https://render.com) account

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/creaturedex.git
cd creaturedex
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env       # Fill in your keys
uvicorn main:app --reload
```

### 3. Mobile setup

```bash
cd mobile
npm install
cp ../.env.example .env       # Fill in your Supabase URL + anon key
npx expo start
```

Scan the QR code with **Expo Go** on your phone.

### 4. Environment variables

```env
# Backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
JWT_SECRET=your-jwt-secret

# Mobile
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=https://your-render-app.onrender.com
```

---

## Database Schema

```sql
-- Users managed by Supabase Auth

create table creatures (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  species     text not null,
  common_name text not null,
  description text,
  image_url   text not null,
  hp          int not null,
  attack      int not null,
  defence     int not null,
  speed       int not null,
  special     int not null,
  created_at  timestamptz default now()
);

create table battles (
  id            uuid primary key default gen_random_uuid(),
  challenger_id uuid references auth.users not null,
  opponent_id   uuid references auth.users not null,
  status        text default 'pending',   -- pending | active | finished
  turn          uuid references auth.users,
  state         jsonb,                    -- full battle state snapshot
  winner_id     uuid references auth.users,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
```

---

## How Stat Generation Works

CreatureDex maps real biological traits extracted by Gemini to battle stats using a deterministic rules engine — so the same species always gets the same stats.

| Stat | Derived From |
|---|---|
| HP | Body mass / size class |
| Attack | Predator status, venom, claws |
| Defence | Shell, armour, camouflage |
| Speed | Locomotion type, known top speed |
| Special | Unique abilities (echolocation, electric, etc.) |

---

## Roadmap

- [ ] Species rarity tiers (Common → Legendary)
- [ ] Leaderboard and ranked battles
- [ ] Evolution system based on catching duplicates
- [ ] Region-based creature discovery map
- [ ] Trading between players

---

## Known Limitations (Free Tier)

- **Render cold starts** — the backend may take 30–60 seconds to respond after a period of inactivity
- **Supabase inactivity pause** — the database pauses after 1 week with no traffic; use [UptimeRobot](https://uptimerobot.com) (free) to prevent this
- **Gemini Flash** — 1,500 requests/day on the free tier; more than sufficient for development and demos

---

## Built By

Yhuen Yutico  
[GitHub](https://github.com/yhuen24) · [LinkedIn](https://www.linkedin.com/in/yhuenyutico/)

Tafshi Uthshow Hoque 
[GitHub](https://github.com/Draxgter1001) · [LinkedIn](https://www.linkedin.com/in/tafshi/)



---

## License

MIT
