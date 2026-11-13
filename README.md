# Rebuy Tracker

A real-time poker rebuy tracking app for home games. The dealer manages the table while players track their buy-ins, view live standings, and see settlement payouts — all from their phones.

**Live:** [https://rebuy-app-6d0b5.web.app](https://rebuy-app-6d0b5.web.app)

---

## Features

### Dealer Dashboard (password-protected)
- Add/remove players with autocomplete from 15 predefined names
- Track buy-ins and black coin counts per player
- Designate a host (earns $1.50/player host fee)
- Approve player rebuy requests with browser push notifications
- View live pot total, balance status, and settlement suggestions
- Save settlement snapshots to Firestore (retained 30 days)
- Lock/unlock games to prevent new player joins after settlement
- Reset game (saves stats to Hall of Fame) or close table permanently
- Share join link for players to scan and join directly
- Configure table display name and custom dealer PIN
- View settlement history

### Player View
- Real-time buy-in count, black coin count, and net balance
- Request rebuys (dealer gets notified)
- Personal settlement payouts ("You pay X" / "X pays you")
- Full table standings with buy-in timestamp tooltips
- Complete settlement breakdown visible when game is balanced

### Hall of Fame (`/stats`)
- Lifetime leaderboard across all games
- Tracks games played, total buy-ins, and net profit per player
- Trophy/medal icons for top 3 players
- Stats saved automatically when dealer resets a game

### Save as Image
- Capture settlement card as a PNG using `html2canvas`
- Mobile: shares via Web Share API
- Desktop: downloads as `settlement.png`
- Handles dark mode background and CSS animation interference

### Game Lifecycle
- **Open** — new players can join freely
- **Settled/Locked** — settlement saved, new players blocked, existing players view results
- **30-day retention** — settled games auto-delete after 30 days
- **Reset** — clears players, saves stats to Hall of Fame, unlocks table for new game
- **Close** — saves final settlement, deletes table permanently

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.5.9 with Turbopack |
| UI | React 19, Tailwind CSS 3.4, Radix UI primitives |
| Icons | Lucide React |
| Backend | Firebase Firestore (real-time sync) |
| Auth | Firebase Anonymous Authentication |
| Hosting | Firebase Hosting (static export) |
| CI/CD | GitHub Actions (auto-deploy on push to main) |
| Image Capture | html2canvas |
| Charts | Recharts |
| Theming | next-themes (dark/light mode) |
| Fonts | Inter (body), Space Grotesk (headlines) |

---

## Architecture

### Static Export

The app uses `output: 'export'` in Next.js config, producing fully static HTML/JS/CSS. No server runtime — everything runs client-side with Firebase as the backend.

### Firebase Projects

| Purpose | Project ID |
|---------|-----------|
| Backend (Firestore, Auth) | `studio-2155287500-47ceb` |
| Hosting | `rebuy-app-6d0b5` |

### Firestore Data Model

```
players/{playerId}                    # Legacy global players collection
playerStats/{playerName}              # Lifetime stats (Hall of Fame)
  ├── name, gamesPlayed, totalBuyIns
  ├── totalProfit, lastPlayed
tables/{tableId}                      # Game tables
  ├── id, displayName, pin, lastActive
  ├── isSettled, settledAt, expireAt  # Game lock & 30-day TTL
  ├── players/{playerId}              # Table-scoped players
  │   ├── name, blackCoins, createdAt
  │   ├── rebuyTimestamps[], isHost
  │   └── hasPendingRebuyRequest
  └── settlements/{settlementId}      # Settlement snapshots
      ├── settledAt, expireAt
      ├── players[], transactions[]
      └── totalPot
```

### Security Rules

All Firestore operations require Firebase anonymous authentication. No public access.

```
players/{playerId}                    → read, write if auth != null
playerStats/{playerId}                → read, write if auth != null
tables/{tableId}                      → read, write if auth != null
  /players/{playerId}                 → read, write if auth != null
  /settlements/{settlementId}         → read, write if auth != null
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout, Firebase provider, theme
│   ├── page.tsx                      # Home page, role selector, expired game cleanup
│   ├── (game)/
│   │   ├── layout.tsx                # Auth guard + GameProvider wrapper
│   │   ├── dealer/page.tsx           # Password-protected dealer dashboard
│   │   └── player/page.tsx           # Player view with settled-game guard
│   ├── join/page.tsx                 # Join via shared link
│   └── stats/page.tsx                # Hall of Fame leaderboard
├── components/
│   ├── auth/
│   │   └── role-selector.tsx         # Player/Dealer tab selector with table picker
│   ├── dashboard/
│   │   ├── app-header.tsx            # Sticky header, theme toggle, pot display
│   │   ├── dealer-view.tsx           # Full dealer dashboard layout
│   │   ├── distro-suggestion.tsx     # Settlement card with save-as-image
│   │   ├── player-list.tsx           # Player table (dealer: editable, player: read-only)
│   │   ├── player-view.tsx           # Player's personal dashboard
│   │   └── totals.tsx                # Pot total and balance status card
│   ├── shared/
│   │   └── confirmation-dialog.tsx   # Reusable confirm dialog (Radix AlertDialog)
│   └── ui/                           # shadcn/ui component library
│       └── player-name-input.tsx     # Autocomplete with keyboard navigation
├── contexts/
│   └── game-context.tsx              # Central state: players, settlements, table lock
├── firebase/
│   ├── config.ts                     # Firebase project config
│   ├── index.ts                      # Firebase init, hooks (useFirebase, useCollection)
│   ├── error-emitter.ts              # Permission error event bus
│   └── errors.ts                     # Custom Firestore error types
├── hooks/
│   ├── use-mobile.tsx                # Mobile breakpoint detection
│   └── use-toast.ts                  # Toast notification hook
└── lib/
    ├── known-players.ts              # 15 predefined player names for autocomplete
    ├── placeholder-images.ts         # Background images for login screens
    ├── settlement.ts                 # Settlement algorithm, constants
    ├── types.ts                      # TypeScript types (Player, Table, etc.)
    └── utils.ts                      # cn() utility for class merging
```

---

## Key Workflows

### 1. Game Setup (Dealer)

```
Home Page → Select "Dealer" tab → Pick existing table or create new
→ Enter dealer password (default: test1234, or custom PIN)
→ Dealer Dashboard loads
→ Add players (autocomplete dropdown, excludes already-seated)
→ Share join link with players
```

### 2. Player Joins

```
Home Page → Select "Player" tab → Pick table → Enter name → Join
  — or —
Scan join link → Enter name → Join
→ Player auto-created in Firestore if not exists
→ Real-time view of buy-ins, standings, and settlement
```

### 3. During the Game

```
Player requests rebuy → Dealer gets notification → Approves/denies
Dealer adds/removes rebuys manually
Dealer updates black coin counts as players cash out
Totals card shows live balance status (balanced = ready for settlement)
```

### 4. Settlement

```
All black coins entered → Totals show "balanced"
→ Settlement card shows optimized payment list
→ Players see personal "You pay X" / "X pays you" cards
→ Dealer clicks "Save Settlement Snapshot"
  → Saved to Firestore with 30-day retention
  → Table auto-locked (no new players)
  → Existing players can still view results
→ Dealer can also manually Lock/Unlock via "Game Access" card
```

### 5. Game Reset / New Round

```
Dealer clicks "Reset Game"
→ Player stats saved to Hall of Fame (atomic increments)
→ All players removed
→ Table unlocked for new players
→ New round begins
```

### 6. 30-Day Cleanup

```
Any user visits home page
→ App queries tables where expireAt <= now
→ Deletes expired tables + their players + settlements subcollections
→ Expired games disappear from table picker
```

---

## Settlement Algorithm

Located in `src/lib/settlement.ts`:

| Constant | Value |
|----------|-------|
| `BUYIN_VALUE` | $10 per buy-in |
| `HOST_FEE` | $1.50 per player |

**Steps:**
1. Calculate each player's net: `(blackCoins - buyIns) * $10`
2. Subtract host fee from non-host players, add collected fees to host
3. Split players into debtors (negative balance) and creditors (positive balance)
4. Sort both lists by magnitude (largest first)
5. Greedily match largest debtor to largest creditor, transferring the minimum of both
6. Repeat until all balances are zero

This produces the minimum number of transactions to settle all debts.

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Install & Run

```bash
git clone https://github.com/balajigk97/Rebuy_tracker.git
cd Rebuy_tracker
npm install
npm run dev
```

The app starts at `http://localhost:3000` (or the next available port).

### Build for Production

```bash
npm run build
```

Outputs static files to `out/` directory.

### Deploy to Firebase Hosting

Automatic on push to `main` via GitHub Actions. Manual deploy:

```bash
npx firebase deploy --only hosting --project rebuy-app-6d0b5
```

### Environment Variables (optional)

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_DEALER_PASSWORD` | Default dealer password | `test1234` |

The dealer PIN can also be set per-table via Table Settings in the dealer dashboard.

---

## Predefined Players

The autocomplete dropdown includes 15 predefined names (custom names also accepted):

Anil, Balaji, Madhu, Raghu, Koti, Sudheer, Umesh, Karthik, Pruthvi, Sricharan, Shankar, Prasad, Sagar, Sravan, Siva

Edit `src/lib/known-players.ts` to customize.

---

## CI/CD

GitHub Actions workflow (`.github/workflows/firebase-deploy.yml`) runs on every push to `main`:

1. Checkout code
2. Setup Node.js 20 with npm cache
3. `npm ci` (clean install)
4. `npm run build` (static export)
5. Deploy to Firebase Hosting (`rebuy-app-6d0b5`, live channel)

**Required GitHub Secret:** `FIREBASE_SERVICE_ACCOUNT` — Firebase service account JSON for the hosting project.

---

## Dark Mode

- Toggle via sun/moon icon in the header
- Persists to `localStorage`
- Respects system preference on first visit
- Flash-of-unstyled-content prevented via inline script in `<head>`
- Save-as-image detects dark mode and uses appropriate background color (`#0c1e1e`)
