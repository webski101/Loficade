# Loficade

Daily ice-drill mini-game for **Lofi the Yeti** (CLAY Hackathon III).

Guide Lofi down today’s seeded shaft, catch meltwater, dodge rock and plastic, and feed the Flurry community well.

## Play locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js App Router
- Canvas game loop with a shared daily seed (`Africa/Lagos` calendar day)
- In-memory leaderboard + community well meter via `/api/scores`
