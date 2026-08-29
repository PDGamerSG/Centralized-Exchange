# OpenExchange

A toy crypto exchange built as a turborepo monorepo. An in-memory matching engine
processes orders that arrive over a Redis queue, publishes market data over Redis
pub/sub, and a set of small services fan that data out to clients and storage.

## Architecture

```
                 HTTP                    Redis queue ("messages")
  frontend  ────────────►  api  ─────────────────────────────►  engine
 (Next.js)                (express)                            (matching)
     ▲                       ▲                                    │
     │        reply on unique client-id channel (pub/sub)         │
     │                       └────────────────────────────────────┤
     │  websocket                                                 │
     └───────────  ws  ◄──── depth@/trade@ channels (pub/sub) ────┤
                                                                  │
                db worker ◄── Redis queue ("db_processor") ───────┘
                    │
                    ▼
              TimescaleDB (trades + kline materialized views)
```

## Apps

| App           | What it does                                                        | Port |
| ------------- | ------------------------------------------------------------------- | ---- |
| `apps/engine` | In-memory orderbook, balances, matching; snapshots state to disk    | –    |
| `apps/api`    | REST API for orders, depth, klines and tickers                      | 3000 |
| `apps/ws`     | WebSocket server streaming depth/trade updates to subscribers       | 3001 |
| `apps/db`     | Stores trades in TimescaleDB and refreshes kline materialized views | –    |
| `apps/mm`     | Market maker bot that keeps the TATA_INR book liquid                | –    |
| `apps/web`    | Next.js trading UI (orderbook, candlestick chart, order form)        | 3002 |

## Getting started

Prerequisites: Node 18+, Docker.

**One command** (after the one-time setup below has been done once):

```sh
npm run dev:all    # starts docker infra + every service via turbo
```

**Step by step:**

```sh
# 1. infra: redis + timescaledb
docker compose -f docker/docker-compose.yml up -d

# 2. dependencies
npm install

# 3. create tables and kline views
npm run seed:db --workspace=db

# 4. build everything
npm run build

# 5. run the services (each in its own terminal)
npm run start --workspace=engine
npm run start --workspace=api
npm run start --workspace=ws-server
npm run start --workspace=db
npm run start --workspace=web      # http://localhost:3002/trade/TATA_INR

# optional: fake liquidity
npm run start --workspace=mm
```

## API

Base URL: `http://localhost:3000/api/v1`

| Method   | Path                                                | Description                     |
| -------- | --------------------------------------------------- | ------------------------------- |
| `POST`   | `/order`                                             | Place a limit order             |
| `DELETE` | `/order`                                             | Cancel an order                 |
| `GET`    | `/order/open?userId=&market=`                        | Open orders for a user          |
| `GET`    | `/depth?symbol=`                                     | Aggregated orderbook depth      |
| `GET`    | `/klines?symbol=&interval=&startTime=&endTime=`      | Candles (`1m`, `1h`, `1w`)      |

Example:

```sh
curl -X POST http://localhost:3000/api/v1/order \
  -H "content-type: application/json" \
  -d '{"market":"TATA_INR","price":"1000","quantity":"1","side":"buy","userId":"1"}'
```

## WebSocket

Connect to `ws://localhost:3001` and subscribe to channels:

```json
{ "method": "SUBSCRIBE", "params": ["depth@TATA_INR", "trade@TATA_INR"] }
```

## Tests

The engine's orderbook (matching, price-time priority, partial fills, cancel,
depth) is covered by vitest:

```sh
npm test --workspace=engine
```

## Frontend

The web UI shows **live market data from Backpack exchange** (e.g. `SOL_USDC`).
The depth, ticker and trade streams come straight from `wss://ws.backpack.exchange`;
REST calls go through the route handler in `apps/web/app/backpack-api`, which
refetches them server side. (Backpack sends no CORS headers, and a plain Next
rewrite forwards the browser's `Origin`/`Referer`/`Sec-Fetch-*` headers, which
the upstream edge answers with 403 — so the proxy rebuilds the request instead.)

The local engine/api/ws stack still runs the toy `TATA_INR` market; to point the
UI at it instead — which is also what enables order placement from the form — set:

```sh
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

What the UI does:

- **Markets** (`/markets`) — searchable, sortable list with 24h change, quote
  volume and a low/high range meter, plus starred markets kept in local storage.
- **Trade** (`/trade/[market]`) — candlestick chart with 1m–1D intervals and
  volume, an order book with price grouping, cumulative depth bars, spread and
  click-to-fill, a recent-trades tape, and a limit/market order ticket.
- **Responsive by breakpoint** — three columns on desktop, chart beside the book
  on tablets, and on phones a tabbed panel with a buy/sell bar that opens the
  order ticket in a bottom sheet. The screen is always exactly one viewport tall.
- **Themes** — dark by default, light via the toggle; the chart re-reads its
  colours from the CSS tokens on every switch.

## Notes

- **No authentication.** `userId` is taken from the request body, so any caller can
  act as any user — placing and cancelling orders included. Fine for a local demo;
  before exposing this anywhere, add real auth (sessions/JWT), derive the user id
  from the verified session, and enforce order ownership on cancel in the engine.
- Markets are seeded with a single `TATA_INR` book and demo users `1`, `2` and `5`
  holding balances.
- The engine snapshots its state to `snapshot.json` every 3 seconds; start it via
  `npm run start --workspace=engine` to restore from the snapshot.
- Money math uses floats — fine for a toy exchange, not for production.
