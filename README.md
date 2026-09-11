<img width="1280" height="640" alt="QR Quest Banner" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />

# QR Quest 🎮🔒

**Game-Gated QR Codes** — Generate QR codes that challenge scanners with a mini-game before revealing the destination!

## Basic Details

### Team Name: Singularity

### Project Description
A web app where QR codes don't go straight to the destination. Instead, scanning one opens a random mini-game built directly into the QR code matrix. Only after winning does the player get redirected to the real URL!

### The Problem (that doesn't exist)
QR codes are just *too easy* to use. You scan, you go. Where's the thrill? The challenge? The existential dread?

### The Solution (that nobody asked for)
We put a fun mini-game between the scan and the destination. Want that link? **Earn it.** 🏆

## Technical Details

### Technologies/Components Used

**Languages:** TypeScript, CSS
**Framework:** Next.js 16 (App Router)
**Libraries:**
- `@supabase/supabase-js` — Postgres database
- `qrcode.react` — QR code generation
- `html5-qrcode` — In-browser QR scanning
- `canvas-confetti` — Win celebration effects
- `lucide-react` — Icons
- `tailwindcss` v4 — Styling

**Tools:** Vercel (hosting), Supabase (database)

## How It Works

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐     ┌──────────────┐
│   /create    │     │   Scan QR     │     │  /q/{id}     │     │ Destination  │
│              │────▶│  with phone   │────▶│  Play game!  │────▶│    URL       │
│ Generate QR  │     │   camera      │     │ 🏰🎮🧩      │     │  🎉🔓       │
└──────────────┘     └───────────────┘     └──────────────┘     └──────────────┘
```

1. **Generate** — Paste any URL on `/create`, get a QR code that encodes `our-site.com/q/{id}`
2. **Scan** — Anyone scans it with their phone camera (or use `/scan` for demo)
3. **Play** — A random game appears built directly inside the live QR code matrix
4. **Unlock** — Win the game → confetti 🎉 → redirect to the real destination!

### The QR Matrix Mini-Games

| Game | Description | Controls |
|------|-------------|----------|
| 🏰 QR Maze | Navigate through the actual QR code labyrinth to the exit portal | Arrow keys + on-screen D-pad |
| 👾 QR Chase | Collect energy dots across the QR matrix while dodging glitch bots | Arrow keys + on-screen D-pad |
| 🔨 Module Smasher | Squash glitched animated bug modules corrupting the QR code | Click / Tap |
| 🕵️ Imposter Block | Spot and tap 3 sneaky imposters camouflaged within the QR pattern | Click / Tap |

## Setup & Installation

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier)

### Database Setup
Run this SQL in Supabase's SQL Editor:

```sql
create table qr_codes (
  id text primary key default substr(md5(random()::text), 1, 6),
  destination_url text not null,
  label text,
  created_at timestamptz default now(),
  completed_count int default 0
);

alter table qr_codes enable row level security;
create policy "public read" on qr_codes for select using (true);
create policy "public insert" on qr_codes for insert with check (true);
create policy "public update count" on qr_codes for update using (true);
```

### Installation

```bash
# Clone the repo
git clone https://github.com/your-username/useless_project_singularity.git
cd useless_project_singularity

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase URL and anon key

# Run dev server
npm run dev
```

### Environment Variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Deploy to Vercel

1. Push to GitHub
2. Import the repo on [Vercel](https://vercel.com)
3. Add the three environment variables in Vercel's dashboard
4. Update `NEXT_PUBLIC_SITE_URL` to your deployed URL
5. Redeploy

## Project Documentation

### Screenshots

![Landing Page](screenshots/landing.png)
*The QR Quest landing page with claymorphism design*

![Create QR](screenshots/create.png)
*Generate a game-gated QR code for any URL*

![Game Challenge](screenshots/game.png)
*One of three random mini-games appears when scanning the QR*

## Team Contributions
- Built with ❤️ for the hackathon

---
Made with ❤️ at TinkerHub Useless Projects

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)
