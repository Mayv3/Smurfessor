# 🎮 Smurfessor

**Porofessor-lite** — Dashboard de cuentas de League of Legends con detección de partida en vivo.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | **Astro 5** (SSR) |
| Deploy | **Vercel** (serverless + cron) |
| UI islands | **React 19** + **React Query** |
| Estilos | **TailwindCSS 3** |
| Tipos | **TypeScript** (strict) |
| Validación | **zod** |
| Cache server | **lru-cache** (TTL por tipo) |
| Rate limit | **Bottleneck** (concurrency + minTime) |
| Tests | **Vitest** (unit) + **Playwright** (e2e) |
| Lint/Format | **ESLint** + **Prettier** |

## Setup local

```bash
# 1. Clonar
git clone <repo-url> && cd smurfessor

# 2. Instalar
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# → Editar .env con tu RIOT_API_KEY

# 4. Desarrollo
npm run dev
# → http://localhost:4321
```

## Variables de entorno

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `RIOT_API_KEY` | ✅ | — | API key de Riot Games (`RGAPI-...`) |
| `CRON_SECRET` | ✅ (prod) | — | Secret para proteger el endpoint de cron |
| `FEATURE_SPECTATOR` | ❌ | `true` | Habilitar detección de partida en vivo |
| `FEATURE_MATCH_HISTORY` | ❌ | `false` | Habilitar historial (consume más rate limit) |

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (localhost:4321) |
| `npm run build` | Build de producción (`astro check` + `astro build`) |
| `npm run preview` | Preview de la build |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm test` | Tests unitarios (Vitest) |
| `npm run test:e2e` | Tests E2E (Playwright) |

## Deploy en Vercel

1. **Conectar** el repo a Vercel (detecta Astro automáticamente).
2. **Agregar variables de entorno** en el dashboard de Vercel:
   - `RIOT_API_KEY=RGAPI-...`
   - `CRON_SECRET=<string-largo-random>`
   - `FEATURE_SPECTATOR=true`
   - `FEATURE_MATCH_HISTORY=false`
3. **Deploy** — Vercel usa el adapter `@astrojs/vercel` automáticamente.

### Vercel Cron (warm-up de cache)

El archivo `vercel.json` configura un cron diario a las 06:00 UTC:

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh",
      "schedule": "0 6 * * *"
    }
  ]
}
```

Vercel envía `Authorization: Bearer ${CRON_SECRET}` al endpoint.

> ⚠️ **El cron NO renueva la Dev Key** — solo precalienta caches (puuid, summoner, league, mastery, DDragon).

## Notas importantes

### API Key de Riot
- La **Dev Key** expira cada **24 horas**.
- Para "always on", solicitá una **Production Key** en https://developer.riotgames.com.
- El cron diario **no renueva** la key; solo precalienta caches con la key actual.

### Spectator
- El endpoint de Spectator-V5 puede no estar disponible en algunas regiones/momentos.
- Si falla → **fallback offline** automático con mensaje amigable.
- Si la API key es inválida → banner de error claro.

### Match History
- `FEATURE_MATCH_HISTORY=true` habilita endpoints de Match-V5.
- **Cuidado**: consume significativamente más rate limit.
- Recomendado solo con **Production Key**.
- Por defecto está **deshabilitado**.

### Caching (TTL)

| Dato | TTL |
|------|-----|
| Riot ID → puuid | 24 h |
| Summoner by puuid | 24 h |
| League entries | 30 min |
| Champion mastery | 30 min |
| Live game (spectator) | 10 s |
| DDragon (versions, champions, spells) | 24 h |
| Match history (si habilitado) | 15 min |

## Estructura del proyecto

```
src/
├── components/              # React islands
│   ├── GamePage.tsx         # Orquestador (React Query)
│   ├── MatchView.tsx        # Vista de partida en vivo (2 columnas)
│   ├── OfflineView.tsx      # Vista cuando no hay partida
│   ├── PlayerCard.tsx       # Card expandible por jugador
│   └── ui/
│       ├── ErrorBanner.tsx  # Banner de error
│       ├── RankBadge.tsx    # Badge de rango (tier/LP/WR)
│       └── SkeletonLoader.tsx
├── config/
│   ├── accounts.ts          # 16 cuentas rastreadas
│   └── features.ts          # Feature flags
├── layouts/
│   └── Layout.astro         # Layout base
├── lib/
│   ├── api-response.ts      # ok() / err() helpers
│   ├── cache.ts             # LRU cache con TTL
│   ├── ddragon/             # Data Dragon (assets)
│   │   ├── index.ts
│   │   └── types.ts
│   └── riot/                # Riot API wrapper
│       ├── endpoints.ts     # Cached endpoint calls
│       ├── errors.ts        # RiotApiError + codes
│       ├── http.ts          # Fetch + Bottleneck + retry
│       ├── normalize.ts     # Spectator → normalized
│       └── types.ts         # Raw + normalized types
├── pages/
│   ├── api/
│   │   ├── accounts.ts      # GET /api/accounts
│   │   ├── cron/
│   │   │   └── refresh.ts   # GET /api/cron/refresh
│   │   ├── ddragon/
│   │   │   └── bootstrap.ts # GET /api/ddragon/bootstrap
│   │   ├── live-game.ts     # GET /api/live-game
│   │   ├── player-summary.ts# GET /api/player-summary
│   │   └── resolve.ts       # GET /api/resolve
│   ├── game/
│   │   └── [key].astro      # /game/:key
│   └── index.astro          # Dashboard /
└── styles/
    └── global.css            # Tailwind directives
```

## TODOs

- [ ] **12H/30D stats**: requiere `FEATURE_MATCH_HISTORY=true` + lógica de agregación
- [ ] **Role detection**: heurísticas basadas en match history
- [ ] **Player tags/pills**: "First timer", "On a streak", etc.
- [ ] **Champion winrate**: calcular desde match history
- [ ] **K/D/A promedio**: agregación de últimas partidas
- [ ] **Runes/items**: datos adicionales del spectator endpoint
