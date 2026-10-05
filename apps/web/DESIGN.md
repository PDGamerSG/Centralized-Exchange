# OpenExchange interface

OpenExchange is an interface for scanning live markets and inspecting trades. The design preserves its monochrome identity and favors clarity when a trader watches prices for an extended session. Dark is the initial theme; a saved light preference is applied before paint.

## Visual system

- Manrope for navigation, headings, controls, and summaries. JetBrains Mono for dense prices and measurement. Numbers align with tabular numerals.
- Dark surfaces: background `hsl(0 0% 5%)`, card `hsl(0 0% 7.5%)`, elevated `hsl(0 0% 10.2%)`. Foreground is `hsl(0 0% 94%)`, muted text `hsl(0 0% 62%)`, borders `hsl(0 0% 17%)`.
- Existing light tokens retain white cards on a neutral gray page. All surfaces and charts read semantic CSS tokens.
- Green and red describe market movement and order sides. Navigation and primary general actions remain monochrome.
- Containers use 12px radii with thin borders. Controls use 6–8px radii. Avoid decorative gradients, glow, or shadows beneath bordered containers.
- Headings use moderate negative tracking, no more than -0.035em. Numeric summaries use 20–28px type; the market heading uses 36–48px.

## Composition

The navigation is 64px tall. The market page has a 1440px maximum width with 16px mobile, 32px tablet, and 48px desktop gutters. Intro, aggregate statistics, major markets, and the directory have distinct spacing groups. The directory and a 268px market-movers sidebar share the desktop grid.

Major-market summaries use actual price, percentage change, and the low/high range. On phones they scroll horizontally, preserving room for the primary directory. Tables show twelve rows per page. The market type selector, search, watchlist, and gain/loss filters combine; sorting is reflected by accessible column state. Secondary columns appear progressively as space permits.

The trading terminal keeps its single-viewport layout, subtracting the shared 64px header. Phones show chart/book/trades controls and a bottom buy/sell bar; the order form remains in the existing sheet. Larger screens show the chart, book, and order ticket together.

## Truth and states

Quote currencies stay visible. Overview volume aggregates USDC pairs only; the mover volume ranking compares USDC spot pairs. Perpetuals remain explicitly marked. Favorites persist locally. Funding and live-feed order placement clearly explain the existing demo limitation.

Ticker requests time out after fifteen seconds. Failed loads show a retry action; stale data remains visible with an interrupted-update status. Featured summaries and movers never manufacture sample prices. Empty searches and watchlists describe the next useful action.

## Interaction

Links navigate; buttons act. Each icon action has a label. Selected filters use `aria-pressed`; navigation uses `aria-current`; sortable headers use `aria-sort`. A skip link targets the main content. Keyboard focus remains visible, decorative SVGs are hidden from assistive technology, and existing reduced-motion rules apply. Hover effects use short color or opacity transitions.

## References and verification

Reference interfaces: Coinbase Advanced and Backpack Markets. Supporting guidance: Frontend Design, Impeccable polish, UI/UX Pro Max, Vercel React Best Practices, and Vercel Web Interface Guidelines. The exact improved task prompt and installed skill inventory are in the local `docs/ui` directory, which this repository intentionally excludes from publication.
