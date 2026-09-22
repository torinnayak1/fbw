# Fat Bear Week 2026 Championship

Private 7-player prediction pool for the official 16-bear Fat Bear Week 2026 bracket.

## How it works

- Fill out the whole bracket (Round of 16 through the final).
- **Brackets lock tonight: Tuesday, Sep 22, 2026 at 11:59 PM Pacific.**
- After lock, everyone can see everyone else's bracket.
- Correct picks score points that **double each round**:

| Round | Points per correct pick |
| --- | --- |
| Round of 16 | 1 |
| Quarterfinals | 2 |
| Semifinals | 4 |
| Championship | 8 |

Maximum score is 32.

As official Fat Bear Week results come in, a ranger/admin logs them so the standings update.

## Player passwords

| Player | Password |
| --- | --- |
| R | `HollyCubs` |
| T | `Otis480` |
| S | `Grazer128` |
| M | `Chunk32` |
| B | `Backpack89` |
| Tej | `BrooksTej` |
| Mamama | `MamaBear` |
| Ranger / Admin | `Ranger2026` |

## Run it

All seven players need to hit the **same running server** so picks and scores stay in sync.

Copy `.env.example` to `.env.local` and fill in your Supabase project URL plus keys. The secret key stays on the server; the publishable key is used only for live UI updates.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Picks are stored in the Supabase `picks` table (one row per matchup: `Round`, `R`, `T`, `S`, `M`, `B`, `Tej`, `Mamama`, `Results`). Run `supabase/setup.sql` once in the Supabase SQL editor so Realtime can push table changes into the app.

### Vercel

Add the same env vars from `.env.example` in the Vercel project settings, then redeploy.

Photos are the official 2026 Fat Bear Week before/after composites from NPS / Explore.org.
