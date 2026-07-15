# Centralized Exchange

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
| `apps/web`    | Next.js trading UI (orderbook, candlestick chart, swap form)        | 3002 |

## Getting started

Prerequisites: Node 18+, Docker.

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
