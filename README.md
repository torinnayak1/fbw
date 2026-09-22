# Fat Bear Week 2026 Championship

Private 4-player prediction pool for the official 16-bear Fat Bear Week 2026 bracket.

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
| Ranger / Admin | `Ranger2026` |

## Run it

All four players need to hit the **same running server** so picks and scores stay in sync.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

To share it on the same Wi-Fi, use your machine's local IP instead of localhost.

### Vercel

Vercel functions cannot write `data/store.json` (the disk is read-only). This app stores championship data in `/tmp` there, and will use **Upstash Redis** if you add it so all four players share one scoreboard across deploys.

In the Vercel project: **Storage → Create → Upstash Redis**. That injects `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Redeploy after connecting it.

Photos are the official 2026 Fat Bear Week before/after composites from NPS / Explore.org.
