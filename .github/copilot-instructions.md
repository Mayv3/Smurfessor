# Smurfessor — Porofessor-lite

## Información del Proyecto
App web Astro SSR + React islands + Tailwind que muestra un dashboard de cuentas (Riot IDs) y partida en vivo.

### Tecnologías
- Astro 5 (SSR) + @astrojs/vercel
- React 19 + React Query
- TailwindCSS 3 (PostCSS)
- TypeScript (strict mode)
- zod, lru-cache, Bottleneck
- Vitest + Playwright

### Comandos Disponibles
- `npm run dev` - Servidor de desarrollo (localhost:4321)
- `npm run build` - Build de producción
- `npm run preview` - Preview de la build
- `npm test` - Tests unitarios
- `npm run test:e2e` - Tests E2E
- `npm run lint` / `npm run format` - Lint y formato

### API Routes
- `GET /api/accounts` - Lista de cuentas
- `GET /api/resolve?key=...` - Resuelve puuid
- `GET /api/live-game?puuid=...&platform=LA2` - Partida en vivo
- `GET /api/player-summary?puuid=...&platform=LA2` - Resumen de jugador
- `GET /api/ddragon/bootstrap` - Assets DDragon
- `GET /api/cron/refresh` - Warm-up de caches (protegido)

### Variables de Entorno
- `RIOT_API_KEY` - API key de Riot Games
- `CRON_SECRET` - Secret para cron endpoint
- `FEATURE_SPECTATOR` - Habilitar spectator (default: true)
- `FEATURE_MATCH_HISTORY` - Habilitar historial (default: false)
